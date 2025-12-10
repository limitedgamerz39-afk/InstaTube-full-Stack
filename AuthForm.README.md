# AuthForm Component

## Overview
The AuthForm component is a modern, unified authentication interface that combines both login and signup functionality in a single, toggleable form. It provides an enhanced user experience with improved validation, visual feedback, and a sleek design.

## Features
- Toggle between login and signup views
- Real-time form validation with visual feedback
- Password visibility toggle
- Responsive design for all device sizes
- Integration with backend validation rules
- Social login options
- Loading states and animations
- Accessibility support

## Design Improvements
1. **Modern UI**: Gradient backgrounds, rounded corners, and subtle shadows create a contemporary look
2. **Toggle Interface**: Users can easily switch between login and signup without page reloads
3. **Enhanced Validation**: Client-side validation mirrors backend requirements:
   - Username: 3-30 characters, alphanumeric + underscores only
   - Email: Valid email format
   - Password: Minimum 8 characters with uppercase, lowercase, and number
   - Full Name: 1-50 characters
4. **Visual Feedback**: Clear error messages and success indicators
5. **Password Visibility**: Toggle to show/hide passwords
6. **Loading States**: Animated loading indicators during API calls

## Backend Integration
The component integrates with the existing authentication system and respects all backend validation rules:
- Password requirements (8+ characters, uppercase, lowercase, number)
- Username constraints (3-30 characters, alphanumeric + underscores)
- Email validation
- Full name length limits (50 characters)

## Usage
The component is accessible at `/auth` route and automatically shows the login form by default. Users can toggle to the signup form using the top navigation buttons.

## Dependencies
- React Router for navigation
- AuthContext for authentication state
- Toast notifications for user feedback
- Form validation utilities

## Styling
The component uses the existing CSS classes and Tailwind classes for consistency with the rest of the application. All styling follows the application's design system.