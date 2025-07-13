// Test script to check Supabase email validation
// Run this in your browser console on the Supabase dashboard

const testEmail = 'gleninkoom@gmail.com';

// Test 1: Check if email format is valid
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
console.log('Email format valid:', emailRegex.test(testEmail));

// Test 2: Check if it's a common domain
const domain = testEmail.split('@')[1];
console.log('Domain:', domain);
console.log('Is Gmail:', domain === 'gmail.com');

// Test 3: Check email length
console.log('Email length:', testEmail.length);
console.log('Length valid:', testEmail.length <= 254); 