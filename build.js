#!/usr/bin/env node

// Build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building MitraAI for Vercel deployment...');

try {
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit', cwd: process.cwd() });
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Copy static files if needed
  console.log('📋 Copying static files...');
  if (fs.existsSync('public')) {
    execSync('cp -r public/* dist/', { stdio: 'inherit' });
  }
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: dist/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}