from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    ProfileView,
    ScientificDomainViewSet,
    ArticleViewSet,
    UserArticleViewSet,
    ReviewViewSet,
    StoreArticleListView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'scientific-domains', ScientificDomainViewSet)
router.register(r'articles', ArticleViewSet)
router.register(r'user-articles', UserArticleViewSet, basename='user-article')
router.register(r'reviews', ReviewViewSet, basename='reviews')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('store-articles/', StoreArticleListView.as_view(), name='store-articles'),
    path('', include(router.urls)),
]
