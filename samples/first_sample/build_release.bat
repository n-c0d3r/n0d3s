@echo off

set BUILD_DIR=%0/../../../build/samples/first_sample

if not exist %BUILD_DIR% (
    rem
    mkdir %BUILD_DIR%
)

node %0/../../../build.js -s %0/../source -b %BUILD_DIR% -res %0/../resources -jsen true -jsem true %*