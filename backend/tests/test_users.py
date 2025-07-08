import pytest
import uuid
from httpx import AsyncClient
from fastapi import status

@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    """
    Tests successful user registration.
    The 'async_client' fixture is provided by conftest.py.
    """
    unique_email = f"testuser_{str(uuid.uuid4())[:8]}@example.com"
    
    response = await async_client.post("/api/register", json={
        "email": unique_email,
        "password": "a_very_secure_password"
    })

    # Assert that the request was successful (201 Created)
    assert response.status_code == status.HTTP_201_CREATED

    # Assert that the response body contains the correct data
    response_data = response.json()
    assert response_data["email"] == unique_email
    assert response_data["is_active"] is True
    assert "id" in response_data
    assert "hashed_password" not in response_data