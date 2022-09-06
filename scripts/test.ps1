$build = $true

for ($i = 0; $i -lt $args.Length; $i++) {
    $arg = $args[$i].ToString()
    
    if ($arg -eq '--noBuildTarget') {
        $build = $false
    } else {
        if ($arg.StartsWith('-') -and !$arg.StartsWith('--')) {
            for ($j = 1; $j -lt $arg.Length; $j++) {
                $opt = $arg[$j]

                if ($opt -eq 'b') {
                    $build = $false
                }
            }
        }
    }
}

if ($build) {
    scripts\build.ps1 test
}

npx jest --testMatch **/dist/**/*.test.js --coverage
