import unittest

from app.core.intervals import Interval, format_timecode, normalize_intervals, parse_timecode, select_duration

MIN = 60_000


def iv(s, e, status="probable", **kw):
    return Interval(start_ms=s, end_ms=e, status=status, **kw)


class TimecodeTests(unittest.TestCase):
    def test_parse(self):
        self.assertEqual(parse_timecode("12:03"), 723_000)
        self.assertEqual(parse_timecode("1:02:03"), 3_723_000)
        self.assertEqual(parse_timecode("75:30"), 4_530_000)
        self.assertEqual(parse_timecode("00:01.5"), 1_500)
        self.assertEqual(parse_timecode(83), 83_000)
        self.assertEqual(parse_timecode("83.25"), 83_250)

    def test_parse_rejects_garbage(self):
        for bad in ["", "abc", "12:99", "1:75:00", None, True, -5, float("nan"), "99:99:99:99", 10**9, [], {}]:
            self.assertIsNone(parse_timecode(bad), bad)

    def test_format(self):
        self.assertEqual(format_timecode(723_000), "12:03")
        self.assertEqual(format_timecode(3_723_000), "1:02:03")
        self.assertEqual(format_timecode(-5), "0:00")


class NormalizeTests(unittest.TestCase):
    def test_sorts_and_keeps_gaps(self):
        out, _ = normalize_intervals([iv(500_000, 600_000), iv(0, 100_000)])
        self.assertEqual([(i.start_ms, i.end_ms) for i in out], [(0, 100_000), (500_000, 600_000)])

    def test_merges_overlap_and_touching(self):
        out, _ = normalize_intervals([iv(0, 100_000), iv(90_000, 150_000), iv(150_000, 200_000)])
        self.assertEqual([(i.start_ms, i.end_ms) for i in out], [(0, 200_000)])

    def test_merge_keeps_weaker_status_and_warns(self):
        out, _ = normalize_intervals([iv(0, 100, "probable"), iv(50, 200, "uncertain")])
        self.assertEqual(out[0].status, "uncertain")
        self.assertTrue(out[0].warnings)

    def test_drops_invalid_not_match_and_out_of_range(self):
        out, warns = normalize_intervals(
            [iv(10, 10), iv(20, 5), iv(0, 100, "not_match"), iv(5_000, 9_000), iv(100, 200)], video_duration_ms=4_000
        )
        self.assertEqual([(i.start_ms, i.end_ms) for i in out], [(100, 200)])
        self.assertEqual(len(warns), 3)

    def test_clips_end_to_video_duration(self):
        out, _ = normalize_intervals([iv(1_000, 9_000)], video_duration_ms=4_000)
        self.assertEqual(out[0].end_ms, 4_000)

    def test_negative_start_clamped(self):
        out, _ = normalize_intervals([iv(-500, 100)])
        self.assertEqual(out[0].start_ms, 0)

    def test_unknown_status_becomes_uncertain(self):
        out, _ = normalize_intervals([iv(0, 100, "great")])
        self.assertEqual(out[0].status, "uncertain")


class SelectionTests(unittest.TestCase):
    def test_30_minutes_available_selects_exactly_20(self):
        ivs = [iv(i * 12 * MIN, i * 12 * MIN + 10 * MIN) for i in range(3)]  # 3 x 10 min = 30 min
        sel = select_duration(ivs, 20 * MIN)
        self.assertEqual(sel.selected_ms, 20 * MIN)
        self.assertTrue(sel.target_met)
        self.assertEqual(sel.shortfall_ms, 0)

    def test_17_30_available_reports_2_30_shortfall(self):
        ivs = [iv(0, 10 * MIN), iv(20 * MIN, 20 * MIN + 7 * MIN + 30_000)]
        sel = select_duration(ivs, 20 * MIN)
        self.assertEqual(sel.selected_ms, 17 * MIN + 30_000)
        self.assertFalse(sel.target_met)
        self.assertEqual(sel.shortfall_ms, 2 * MIN + 30_000)

    def test_gaps_are_never_counted(self):
        sel = select_duration([iv(0, MIN), iv(100 * MIN, 101 * MIN)], 5 * MIN)
        self.assertEqual(sel.selected_ms, 2 * MIN)

    def test_trims_final_interval_and_flags_it(self):
        sel = select_duration([iv(0, 15 * MIN), iv(20 * MIN, 30 * MIN)], 20 * MIN)
        self.assertEqual([i.trimmed for i in sel.selected], [False, True])
        self.assertEqual(sel.selected[1].end_ms - sel.selected[1].start_ms, 5 * MIN)

    def test_no_trim_option(self):
        sel = select_duration([iv(0, 15 * MIN)], 10 * MIN, allow_trim=False)
        self.assertEqual(sel.selected, [])
        self.assertEqual(sel.shortfall_ms, 10 * MIN)

    def test_uncertain_excluded_by_default_and_never_padded(self):
        sel = select_duration([iv(0, 10 * MIN, "uncertain")], 5 * MIN)
        self.assertEqual(sel.selected, [])
        self.assertEqual(sel.excluded_by_status, 1)
        self.assertEqual(sel.shortfall_ms, 5 * MIN)

    def test_verified_only_mode(self):
        sel = select_duration([iv(0, MIN, "probable"), iv(2 * MIN, 3 * MIN, "verified")], 5 * MIN, min_status="verified")
        self.assertEqual(sel.selected_ms, MIN)
        self.assertEqual(sel.selected[0].status, "verified")

    def test_highest_confidence_prefers_verified_then_returns_chronological(self):
        ivs = [iv(0, 5 * MIN, "probable"), iv(10 * MIN, 15 * MIN, "verified"), iv(20 * MIN, 25 * MIN, "probable")]
        sel = select_duration(ivs, 10 * MIN, "highest_confidence")
        self.assertEqual(sel.selected_ms, 10 * MIN)
        self.assertIn(10 * MIN, [i.start_ms for i in sel.selected])
        self.assertEqual([i.start_ms for i in sel.selected], sorted(i.start_ms for i in sel.selected))

    def test_selected_never_overlap_and_inside_source_intervals(self):
        raw = [iv(0, 400_000), iv(300_000, 900_000), iv(2_000_000, 2_500_000)]
        norm, _ = normalize_intervals(raw)
        sel = select_duration(norm, 20 * MIN)
        for a, b in zip(sel.selected, sel.selected[1:]):
            self.assertLessEqual(a.end_ms, b.start_ms)
        self.assertEqual((norm[0].start_ms, norm[0].end_ms), (0, 900_000))  # overlap merged
        self.assertEqual(sel.selected_ms, 20 * MIN)  # 900s + 500s = 1400s of footage, trimmed to the 1200s budget
        self.assertTrue(sel.selected[-1].trimmed)

    def test_bad_arguments(self):
        with self.assertRaises(ValueError):
            select_duration([], 0)
        with self.assertRaises(ValueError):
            select_duration([], 1000, strategy="random")
        with self.assertRaises(ValueError):
            select_duration([], 1000, min_status="great")


if __name__ == "__main__":
    unittest.main()
