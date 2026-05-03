/**
 * ITQAN ERP - Production Entry Point
 * 
 * This file is the main entry point for the application in production.
 * It loads the bundled server logic from the dist-server directory.
 */

console.log('--- Starting ITQAN ERP (Production) ---');

// Import the bundled server
import './dist-server/index.js';
