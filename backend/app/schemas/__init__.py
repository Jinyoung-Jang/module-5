from app.schemas.example import ExampleCreate, ExampleResponse
from app.schemas.user import UserRegister, UserLogin, Token, UserResponse, UserAdminUpdate
from app.schemas.post import PostBase, PostCreate, PostUpdate, PostResponse, PostListResponse
from app.schemas.permission import PermissionCreate, PermissionResponse

__all__ = [
    # Example
    "ExampleCreate",
    "ExampleResponse",
    # User
    "UserRegister",
    "UserLogin",
    "Token",
    "UserResponse",
    "UserAdminUpdate",
    # Post
    "PostBase",
    "PostCreate",
    "PostUpdate",
    "PostResponse",
    "PostListResponse",
    # Permission
    "PermissionCreate",
    "PermissionResponse",
]
