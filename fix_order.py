
path = '/Users/DJFLOWERZ/Desktop/httrack-sites/etrade_template/new.axilthemes.com/demo/template/etrade/index.html'
lines = open(path, 'r').readlines()

# Find markers
ms_start = next((i for i, line in enumerate(lines) if '<!-- Start Most Sold Product Area' in line), -1)
ms_end = next((i for i, line in enumerate(lines) if '<!-- End Most Sold Product Area' in line), -1)
tm_start = next((i for i, line in enumerate(lines) if '<!-- Start Testimonila Area' in line), -1)
tm_end = next((i for i, line in enumerate(lines) if '<!-- End Testimonila Area' in line), -1)

print(f'Most Sold: {ms_start}-{ms_end}')
print(f'Testimonials: {tm_start}-{tm_end}')

if ms_start != -1 and tm_start != -1 and ms_start < tm_start:
    # Most Sold is FIRST. We need to move it AFTER Testimonials.
    # Current: [MS] ... [TM]
    # Blocks:
    # MS Block: lines[ms_start : ms_end+1]
    # Middle: lines[ms_end+1 : tm_start]
    # TM Block: lines[tm_start : tm_end+1]
    
    ms_block = lines[ms_start : ms_end+1]
    middle = lines[ms_end+1 : tm_start]
    tm_block = lines[tm_start : tm_end+1]
    
    # New Order: [TM] [Middle] [MS]
    new_lines = lines[:ms_start] + tm_block + middle + ms_block + lines[tm_end+1:]
    
    with open(path, 'w') as f:
        f.writelines(new_lines)
    print("Reverted order: Testimonials first.")
else:
    print("Order already correct or markers not found.")
