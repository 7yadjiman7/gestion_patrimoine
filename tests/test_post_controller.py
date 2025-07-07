import unittest
from unittest.mock import MagicMock, patch
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import controllers.post_controller as post_controller


class PostControllerTest(unittest.TestCase):
    def setUp(self):
        self.controller = post_controller.IntranetPostController()

    @patch('controllers.post_controller.request')
    def test_list_posts_order(self, mock_request):
        env = MagicMock()
        posts = [
            MagicMock(id=1, name='A', body='b', author_id=MagicMock(name='u'), create_date='2024-01-01', post_type='text', attachment_ids=[], like_ids=[], comment_ids=[]),
            MagicMock(id=2, name='B', body='b', author_id=MagicMock(name='u'), create_date='2024-01-02', post_type='text', attachment_ids=[], like_ids=[], comment_ids=[]),
        ]
        env['intranet.post'].sudo().search.return_value = posts
        mock_request.env = env
        res = self.controller.list_posts()
        env['intranet.post'].sudo().search.assert_called_with([], order='create_date desc')
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_toggle_like_create(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.exists.return_value = True
        env['intranet.post'].sudo().browse.return_value = post
        like_model = MagicMock()
        env['intranet.post.like'].sudo.return_value = like_model
        like_model.search.return_value = []
        mock_request.env = env
        mock_request.env.user.id = 5

        res = self.controller.toggle_like(1)
        like_model.create.assert_called_once()
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_create_post_missing_name_returns_400(self, mock_request):
        env = MagicMock()
        mock_request.env = env
        mock_request.httprequest.files = {}

        res = self.controller.create_post()

        self.assertEqual(res.status_code, 400)
        env['intranet.post'].sudo().create.assert_not_called()


if __name__ == '__main__':
    unittest.main()
