#!/usr/bin/env osascript

-- SuperPicky Automation Script
-- Usage: osascript superpicky.scpt "/path/to/photos"

on run argv
    if (count of argv) < 1 then
        set photoPath to "/Users/zhouheng/Pictures"
    else
        set photoPath to item 1 of argv
    end if
    
    -- Close SuperPicky if already running
    if application "SuperPicky" is running then
        quit application "SuperPicky"
        delay 1
    end if
    
    -- Open SuperPicky
    tell application "SuperPicky" to activate
    delay 3
    
    -- Wait for app to be ready
    tell application "System Events"
        repeat until exists window 1 of process "SuperPicky"
            delay 0.5
        end repeat
        
        -- Set the photo path
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
        
        -- Click start processing button
        tell process "SuperPicky"
            click button "开始处理" of window 1
        end tell
        
        delay 2
        
        -- Handle file organization dialog
        if exists window "文件整理" of process "SuperPicky" then
            tell process "SuperPicky"
                click button "是" of window "文件整理"
            end tell
        end if
        
        -- Wait for processing to complete
        repeat
            delay 5
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
    
    return "Processing complete!"
    
end run
