"""Page-number pagination for list endpoints (API conventions, backend analysis §4.1).

Query: ?page=2&page_size=24 (page_size at most 100).
Response: {"count", "next", "previous", "results"}.
"""

from rest_framework.pagination import PageNumberPagination as DRFPageNumberPagination


class PageNumberPagination(DRFPageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100
