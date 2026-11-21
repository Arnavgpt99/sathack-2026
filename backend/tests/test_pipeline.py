import json
import unittest

from app.errors import ReelixError
from app.pipeline import AnalysisParams, build_timeline_prompt, run_clip_discovery, run_timeline_search

URL = "https://www.youtube.com/watch?v=9hE5-98ZeCg"


class FakeProvider:
    def __init__(self, obj):
        self.obj, self.prompts = obj, []

    def generate_json(self, url, prompt):
        self.prompts.append((url, prompt))
        return self.obj


def timeline_params(**kw):
    base = dict(mode="timeline_search", url=URL, target_entity="Virat Kohli", condition="is on strike",
                target_total_duration_sec=1200)
    base.update(kw)
    return AnalysisParams(**base)


def seg(s, e, conf="high", **kw):
    return {"start": s, "end": e, "confidence": conf, "evidence": f"seen {s}", "evidence_kind": "visual", **kw}


class TimelineTests(unittest.TestCase):
    def run_it(self, intervals, **pkw):
        obj = {"video_duration": "2:00:00", "coverage_note": "full pass", "intervals": intervals}
        return run_timeline_search(timeline_params(**pkw), FakeProvider(obj), lambda p: None)

    def test_exact_20_minutes_when_enough(self):
        # 4 x 8 min = 32 min of high-confidence footage, spread across the match incl. late
        r = self.run_it([seg("0:05:00", "0:13:00"), seg("0:40:00", "0:48:00"), seg("1:10:00", "1:18:00"), seg("1:40:00", "1:48:00")])
        self.assertEqual(r["selectedDurationSec"], 1200)
        self.assertTrue(r["targetMet"])
        self.assertEqual(r["shortfallSec"], 0)
        self.assertEqual(len(r["allDetectedIntervals"]), 4)
        self.assertEqual(sum(i["durationSec"] for i in r["selectedIntervals"]), 1200)
        self.assertEqual(r["selectedIntervals"][-1]["trimmed"], True)

    def test_truthful_shortfall_no_padding(self):
        r = self.run_it([seg("10:00", "20:00"), seg("30:00", "37:30")])
        self.assertEqual(r["selectedDurationSec"], 1050)
        self.assertFalse(r["targetMet"])
        self.assertEqual(r["shortfallSec"], 150)
        self.assertTrue(any("2:30 short" in w for w in r["warnings"]))

    def test_model_only_evidence_is_never_verified_and_low_confidence_not_selected(self):
        r = self.run_it([seg("10:00", "20:00", "high"), seg("30:00", "40:00", "low"), seg("50:00", "60:00", "medium")])
        self.assertTrue(all(i["status"] != "verified" for i in r["allDetectedIntervals"]))
        self.assertEqual(len(r["allDetectedIntervals"]), 3)
        self.assertEqual(len(r["selectedIntervals"]), 1)
        self.assertEqual(r["selectedDurationSec"], 600)

    def test_malformed_overlapping_and_replays(self):
        r = self.run_it([
            seg("10:00", "12:00"), seg("11:30", "14:00"),   # overlap -> merge
            seg("bad", "20:00"), seg("30:00", "29:00"),     # unreadable / inverted
            seg("40:00", "41:00", is_replay=True),          # replay excluded
            "garbage",
        ])
        self.assertEqual([(i["startSec"], i["endSec"]) for i in r["allDetectedIntervals"]], [(600.0, 840.0)])
        joined = " ".join(r["warnings"])
        self.assertIn("unreadable", joined)
        self.assertIn("replay", joined.lower())

    def test_replays_allowed_when_requested(self):
        r = self.run_it([seg("40:00", "41:00", is_replay=True)], include_replays=True)
        self.assertEqual(len(r["allDetectedIntervals"]), 1)

    def test_capabilities_are_truthful(self):
        r = self.run_it([])
        self.assertEqual(r["sourceCapabilities"]["renderable_media"], "unavailable")
        self.assertEqual(r["sourceCapabilities"]["scoreboard_ocr"], "not_attempted")
        self.assertEqual(r["selectedDurationSec"], 0)
        self.assertTrue(any("no matching" in w.lower() for w in r["warnings"]))
        self.assertIn("candidates", r["warnings"][-1])

    def test_missing_interval_list_is_an_error(self):
        with self.assertRaises(ReelixError) as cm:
            run_timeline_search(timeline_params(), FakeProvider({"nope": 1}), lambda p: None)
        self.assertEqual(cm.exception.code, "invalid_model_output")

    def test_phases_reported_in_order(self):
        phases = []
        run_timeline_search(timeline_params(), FakeProvider({"intervals": []}), phases.append)
        self.assertEqual(phases, ["validating_source", "searching_timeline", "selecting_intervals"])

    def test_prompt_contains_entity_condition_and_replay_rule(self):
        p = build_timeline_prompt("Virat Kohli", "is on strike", False)
        self.assertIn("<entity>Virat Kohli</entity>", p)
        self.assertIn("Do NOT include replays", p)
        self.assertIn("ENTIRE timeline", p)

    def test_cache_key_changes_with_every_relevant_input(self):
        base = timeline_params()
        k = base.cache_key("m1")
        variants = [
            base.cache_key("m2"),
            base.cache_key("m1", "other-prompt-version"),
            timeline_params(target_total_duration_sec=600).cache_key("m1"),
            timeline_params(condition="is non-striker").cache_key("m1"),
            timeline_params(target_entity="Rohit Sharma").cache_key("m1"),
            timeline_params(selection_strategy="highest_confidence").cache_key("m1"),
            timeline_params(include_replays=True).cache_key("m1"),
            timeline_params(url="https://www.youtube.com/watch?v=AAAAAAAAAAA").cache_key("m1"),
        ]
        self.assertEqual(len({k, *variants}), 9)
        self.assertEqual(k, timeline_params().cache_key("m1"))


def clip(n, s, e, score=80, **kw):
    return {"title": f"Clip {n}", "hook": "h", "rationale": "r", "start": s, "end": e, "score": score,
            "hook_score": 70, "pacing_score": 71, "clarity_score": 72, "pacing_note": "tight", **kw}


class ClipTests(unittest.TestCase):
    def run_it(self, clips, **kw):
        p = AnalysisParams(mode="clip_discovery", url=URL, aspect_ratio="1:1", **kw)
        return run_clip_discovery(p, FakeProvider({"video_title": "T", "video_duration": "48:15", "clips": clips}), lambda x: None,
                                  metadata_fn=lambda u: {"title": "Real Title", "channel": "Chan"}, max_clips=3)

    def test_maps_to_frontend_clip_shape(self):
        r = self.run_it([clip(1, "01:00", "01:40")])
        c = r["clips"][0]
        for key in ["id", "title", "hook", "rationale", "startSec", "endSec", "score", "hookScore", "pacingScore", "clarityScore",
                    "completionRate", "dropoffNote", "retentionPoints", "favorite", "edited", "exported", "aspectRatio"]:
            self.assertIn(key, c)
        self.assertEqual((c["startSec"], c["endSec"], c["aspectRatio"]), (60.0, 100.0, "1:1"))
        self.assertEqual(c["retentionPoints"], [])           # no fabricated retention data
        self.assertEqual(c["completionRate"], "n/a")
        self.assertEqual(r["source"]["title"], "Real Title")  # oEmbed wins
        self.assertEqual(r["source"]["duration"], "48:15")
        self.assertFalse(r["isSampleData"])

    def test_filters_overlap_bad_length_caps_and_orders_by_score(self):
        r = self.run_it([
            clip(1, "01:00", "01:40", 60), clip(2, "01:10", "01:50", 90),   # overlap: keep 90
            clip(3, "05:00", "05:02", 99),                                   # 2s: too short
            clip(4, "10:00", "10:40", 70), clip(5, "20:00", "20:40", 65), clip(6, "30:00", "30:40", 50),
            clip(7, "bad", "30:40", 50),
        ])
        self.assertEqual([c["title"] for c in r["clips"]], ["Clip 2", "Clip 4", "Clip 5"])
        self.assertEqual([c["id"] for c in r["clips"]], ["clip-1", "clip-2", "clip-3"])

    def test_missing_subscores_fall_back_with_warning(self):
        item = clip(1, "01:00", "01:40", 77)
        del item["hook_score"]
        r = self.run_it([item])
        self.assertEqual(r["clips"][0]["hookScore"], 77)
        self.assertTrue(any("sub-scores" in w for w in r["warnings"]))

    def test_no_usable_clips_is_an_error(self):
        with self.assertRaises(ReelixError) as cm:
            self.run_it([clip(1, "bad", "worse")])
        self.assertEqual(cm.exception.code, "no_clips_found")


if __name__ == "__main__":
    unittest.main()
