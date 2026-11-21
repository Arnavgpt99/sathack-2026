import unittest

from app.core.youtube import canonical_youtube_url, extract_video_id

VID = "9hE5-98ZeCg"


class YouTubeTests(unittest.TestCase):
    def test_accepts_common_forms(self):
        for u in [
            f"https://www.youtube.com/watch?v={VID}",
            f"https://youtube.com/watch?v={VID}&t=30s&utm_source=x",
            f"http://m.youtube.com/watch?v={VID}",
            f"https://youtu.be/{VID}?si=abc",
            f"https://www.youtube.com/shorts/{VID}",
            f"https://www.youtube.com/live/{VID}",
            f"https://www.youtube.com/embed/{VID}",
            f"youtube.com/watch?v={VID}",
        ]:
            self.assertEqual(extract_video_id(u), VID, u)
        self.assertEqual(canonical_youtube_url(f"https://youtu.be/{VID}"), f"https://www.youtube.com/watch?v={VID}")

    def test_rejects_other_hosts_and_tricks(self):
        for u in [
            f"https://youtube.com.evil.com/watch?v={VID}",
            f"https://evil.com/watch?v={VID}",
            f"https://user:pw@www.youtube.com/watch?v={VID}",
            f"https://www.youtube.com:8080/watch?v={VID}",
            f"https://vimeo.com/948271042",
            "https://www.youtube.com/playlist?list=PL123",
            "https://www.youtube.com/@somechannel",
            "https://www.youtube.com/watch?v=short",
            "https://www.youtube.com/watch",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "",
            "   ",
            None,
            123,
            "https://www.youtube.com/watch?v=" + "a" * 3000,
        ]:
            self.assertIsNone(extract_video_id(u), u)


if __name__ == "__main__":
    unittest.main()
