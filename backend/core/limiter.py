from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

class KeyProvider:
    def __init__(self, func):
        self.func = func

    def __call__(self, request: Request) -> str:
        return self.func(request)

default_key_provider = KeyProvider(get_remote_address)
limiter = Limiter(key_func=default_key_provider)