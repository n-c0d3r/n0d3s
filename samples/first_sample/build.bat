@echo off

if not exist %0/../../../build/samples/first_sample (
    rem
    mkdir %0/../../../build/samples/first_sample
)

node %0/../../../build.js -s %0/../source -b %0/../../../build/samples/first_sample %*