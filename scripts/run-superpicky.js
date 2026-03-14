#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const path = require('path');

const PHOTO_DIR = '/Users/zhouheng/Pictures';

function runSuperPicky(photoPath = PHOTO_DIR) {
  return new Promise((resolve, reject) => {
    console.log(`Starting SuperPicky for: ${photoPath}`);
    
    // First, close SuperPicky if running
    exec('pkill -f SuperPicky', () => {
      // Wait a bit
      setTimeout(() => {
        // Open SuperPicky
        exec('open "/Applications/SuperPicky.app"', (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Wait for app to start
          setTimeout(() => {
            // Run AppleScript to automate
            const scriptPath = path.join(__dirname, 'superpicky.scpt');
            const script = `
              set photoPath to "${photoPath}"
              
              tell application "SuperPicky" to activate
              delay 3
              
              tell application "System Events"
                repeat until exists window 1 of process "SuperPicky"
                  delay 0.5
                end repeat
                
                tell process "SuperPicky"
                  set w to window 1
                  set uiElements to entire contents of w
                  repeat with elem in uiElements
                    try
                      if class of elem is text field then
                        set value of elem to photoPath
                        exit repeat
                      end if
                    end try
                  end repeat
                end tell
                
                delay 1
                
                tell process "SuperPicky"
                  click button "开始处理" of window 1
                end tell
                
                delay 2
                
                if exists window "文件整理" of process "SuperPicky" then
                  tell process "SuperPicky"
                    click button "是" of window "文件整理"
                  end tell
                end if
                
                -- Wait for processing
                repeat 60 times
                  delay 2
                  tell process "SuperPicky"
                    try
                      set statusText to value of static text 3 of window 1
                      if statusText is "GOOD" then
                        exit repeat
                      end if
                    on error
                      exit repeat
                    end try
                  end tell
                end repeat
                
              end tell
              
              return "done"
            `;
            
            exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err, stdout, stderr) => {
              if (err) {
                console.error('Error:', err);
                reject(err);
              } else {
                console.log('SuperPicky completed:', stdout);
                resolve(stdout);
              }
            });
            
          }, 3000);
        });
      }, 1000);
    });
  });
}

// If called directly
if (require.main === module) {
  const targetPath = process.argv[2] || PHOTO_DIR;
  runSuperPicky(targetPath)
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

module.exports = { runSuperPicky };
