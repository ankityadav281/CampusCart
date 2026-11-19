from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User

class AuthTests(APITestCase):
    def test_customer_registration(self):
        url = reverse('auth-register')
        data = {
            'username': 'student_new',
            'email': 'student_new@campus.edu',
            'password': 'CampusCart@2026Secure!',
            'confirm_password': 'CampusCart@2026Secure!',
            'full_name': 'New Student',
            'student_id': 'STU9999',
            'department': 'Computer Science',
        }
        res = self.client.post(url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], User.Role.CUSTOMER)
        self.assertTrue(User.objects.filter(username='student_new', role=User.Role.CUSTOMER).exists())

    def test_shopkeeper_registration(self):
        url = reverse('auth-register-shopkeeper')
        data = {
            'shop_name': 'Lovely Bake Studio',
            'username': 'Lovely Bake Studio',
            'email': 'bakestudio@mail.com',
            'password': 'CampusCart@2026Secure!',
            'confirm_password': 'CampusCart@2026Secure!',
            'full_name': 'Lovely',
            'phone': '9785545042',
            'department': 'Uni mall , 2nd floor',
        }
        res = self.client.post(url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], User.Role.SHOP_OWNER)
        # Username follows shop name without underscore
        self.assertEqual(res.data['user']['username'], 'lovelybakestudio')
        user = User.objects.get(username='lovelybakestudio')
        self.assertEqual(user.role, User.Role.SHOP_OWNER)
        self.assertIsNotNone(user.shop)
        self.assertEqual(user.shop.name, 'Lovely Bake Studio')
