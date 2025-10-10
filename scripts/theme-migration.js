#!/usr/bin/env node

/**
 * Theme Migration Script
 *
 * This script helps identify and suggest fixes for theme inconsistencies
 * across the farming app codebase.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

// Patterns to look for and their replacements
const MIGRATION_PATTERNS = {
  // Page containers
  "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-gray-800":
    "page-container",
  "min-h-screen bg-gray-50 dark:bg-slate-900": "page-container",

  // Cards
  "card-enhanced": "farm-card",
  "metric-card": "farm-card farm-card-interactive",
  "bg-white dark:bg-slate-800 rounded-xl shadow-sm border": "farm-card",

  // Buttons
  "btn-enhanced btn-primary": "farm-btn farm-btn-primary",
  "btn-enhanced bg-green-600": "farm-btn farm-btn-success",
  "btn-enhanced bg-blue-600": "farm-btn farm-btn-secondary",
  "btn-enhanced bg-red-500": "farm-btn farm-btn-destructive",
  "btn-enhanced bg-gray-500": "farm-btn farm-btn-outline",

  // Typography
  "text-display": "farm-heading-display",
  "text-heading": "farm-heading-section",
  "text-subheading": "farm-heading-card",
  "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight":
    "farm-heading-display",
  "text-lg sm:text-xl font-semibold": "farm-heading-section",

  // Grids
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6":
    "farm-grid farm-grid-responsive",
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6":
    "farm-grid farm-grid-metrics",
  "grid-mobile-adaptive": "farm-grid farm-grid-responsive",
  "grid-mobile-stack": "farm-grid",

  // Forms
  "form-mobile": "farm-form",
  "input-mobile": "farm-form-input",

  // Colors - suggest semantic colors
  "bg-green-600": "bg-success",
  "text-green-600": "text-success",
  "bg-red-600": "bg-destructive",
  "text-red-600": "text-destructive",
  "bg-blue-600": "bg-info",
  "text-blue-600": "text-info",
  "bg-yellow-600": "bg-warning",
  "text-yellow-600": "text-warning",
};

// Files to check
const TARGET_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const IGNORE_PATTERNS = ["node_modules", ".next", ".git", "dist", "build"];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (shouldIgnoreFile(fullPath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (TARGET_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const issues = [];

  // Check for old patterns
  Object.entries(MIGRATION_PATTERNS).forEach(([oldPattern, newPattern]) => {
    if (content.includes(oldPattern)) {
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes(oldPattern)) {
          issues.push({
            type: "pattern_replacement",
            line: index + 1,
            oldPattern,
            newPattern,
            context: line.trim(),
          });
        }
      });
    }
  });

  // Check for inconsistent color usage
  const colorPatterns = [
    /bg-(red|green|blue|yellow|purple|indigo|pink|gray)-\d{3}/g,
    /text-(red|green|blue|yellow|purple|indigo|pink|gray)-\d{3}/g,
    /border-(red|green|blue|yellow|purple|indigo|pink|gray)-\d{3}/g,
  ];

  colorPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        issues.push({
          type: "color_inconsistency",
          pattern: match,
          suggestion:
            "Consider using semantic colors (success, warning, destructive, info, primary, secondary)",
        });
      });
    }
  });

  // Check for missing theme imports
  if (content.includes("farm-") && !content.includes("farm-theme")) {
    issues.push({
      type: "missing_import",
      suggestion:
        'Consider importing theme components from "@/components/ui/farm-theme"',
    });
  }

  return issues;
}

function generateReport() {
  console.log("🌱 Farm Management System - Theme Consistency Analysis\n");

  const srcPath = path.join(process.cwd(), "src");
  const files = getAllFiles(srcPath);

  let totalIssues = 0;
  const fileReports = [];

  files.forEach((filePath) => {
    const issues = analyzeFile(filePath);
    if (issues.length > 0) {
      totalIssues += issues.length;
      fileReports.push({
        file: path.relative(process.cwd(), filePath),
        issues,
      });
    }
  });

  // Generate summary
  console.log(`📊 Analysis Summary:`);
  console.log(`   Files analyzed: ${files.length}`);
  console.log(`   Files with issues: ${fileReports.length}`);
  console.log(`   Total issues found: ${totalIssues}\n`);

  // Generate detailed report
  if (fileReports.length > 0) {
    console.log("📋 Detailed Issues:\n");

    fileReports.forEach(({ file, issues }) => {
      console.log(`📄 ${file}`);
      console.log(`   Issues: ${issues.length}\n`);

      issues.forEach((issue, index) => {
        switch (issue.type) {
          case "pattern_replacement":
            console.log(`   ${index + 1}. Line ${issue.line}: Replace pattern`);
            console.log(`      Old: ${issue.oldPattern}`);
            console.log(`      New: ${issue.newPattern}`);
            console.log(`      Context: ${issue.context}`);
            break;
          case "color_inconsistency":
            console.log(
              `   ${index + 1}. Color inconsistency: ${issue.pattern}`
            );
            console.log(`      Suggestion: ${issue.suggestion}`);
            break;
          case "missing_import":
            console.log(`   ${index + 1}. ${issue.suggestion}`);
            break;
        }
        console.log("");
      });
      console.log("");
    });
  }

  // Generate migration checklist
  console.log("✅ Migration Checklist:\n");

  const pageFiles = fileReports.filter(
    ({ file }) => file.includes("/app/") && file.endsWith("/page.tsx")
  );

  const componentFiles = fileReports.filter(
    ({ file }) => file.includes("/components/") && !file.includes("/ui/")
  );

  console.log("📄 Pages to update:");
  pageFiles.forEach(({ file }) => {
    console.log(`   - [ ] ${file}`);
  });

  console.log("\n🧩 Components to update:");
  componentFiles.forEach(({ file }) => {
    console.log(`   - [ ] ${file}`);
  });

  console.log("\n🎨 Recommended next steps:");
  console.log("   1. Update page containers to use PageContainer component");
  console.log("   2. Replace custom cards with FarmCard components");
  console.log("   3. Update buttons to use FarmButton components");
  console.log("   4. Replace form elements with Farm* form components");
  console.log("   5. Update typography classes to use farm-* variants");
  console.log("   6. Replace color classes with semantic alternatives");
  console.log("   7. Test dark mode compatibility");
  console.log("   8. Verify mobile responsiveness\n");

  return {
    totalFiles: files.length,
    filesWithIssues: fileReports.length,
    totalIssues,
    reports: fileReports,
  };
}

// Run the analysis
if (require.main === module) {
  try {
    generateReport();
  } catch (error) {
    console.error("❌ Error running theme analysis:", error.message);
    process.exit(1);
  }
}

module.exports = { generateReport, analyzeFile, MIGRATION_PATTERNS };
