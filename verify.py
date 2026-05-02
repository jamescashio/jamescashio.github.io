from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('file:///app/index.html')

    # Scroll to elements
    page.evaluate("window.scrollTo(0, 1000)")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification4.png")

    # Scroll further
    page.evaluate("window.scrollTo(0, 2000)")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification5.png")

    # Scroll to specific div
    page.evaluate("window.scrollTo(0, 2500)")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification6.png")

    browser.close()
