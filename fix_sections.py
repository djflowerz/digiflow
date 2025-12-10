#!/usr/bin/env python3
path = '/Users/DJFLOWERZ/Desktop/httrack-sites/etrade_template/new.axilthemes.com/demo/template/etrade/index.html'
lines = open(path, 'r').readlines()

# Find markers
ms_start = next(i for i, line in enumerate(lines) if '<!-- Start Most Sold Product Area  -->' in line)
ms_end = next(i for i, line in enumerate(lines) if '<!-- End Most Sold Product Area  -->' in line)
tm_start = next(i for i, line in enumerate(lines) if '<!-- Start Testimonila Area  -->' in line)
tm_end = next(i for i, line in enumerate(lines) if '<!-- End Testimonila Area  -->' in line)

print(f'Most Sold: lines {ms_start+1} to {ms_end+1}')
print(f'Testimonials: lines {tm_start+1} to {tm_end+1}')

# If Most Sold comes before Testimonials, swap them
if ms_start < tm_start:
    # Extract blocks
    ms_block = lines[ms_start:ms_end+1]
    middle = lines[ms_end+1:tm_start]
    tm_block = lines[tm_start:tm_end+1]
    
    # Reconstruct: Testimonials first, then Most Sold
    new_lines = lines[:ms_start] + tm_block + middle + ms_block + lines[tm_end+1:]
    
    with open(path, 'w') as f:
        f.writelines(new_lines)
    print('✓ Swapped sections: Testimonials now before Most Sold')
else:
    print('✓ Sections already in correct order')
