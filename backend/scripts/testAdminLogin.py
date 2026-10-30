import getpass
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5001/api/auth"

print("\nEverythingBD Admin Login Test\n")

email = input("Admin Email: ").strip()
password = getpass.getpass("Admin Password: ")

payload = json.dumps({
    "email": email,
    "password": password
}).encode("utf-8")

request = urllib.request.Request(
    BASE_URL + "/login",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.load(response)
        print("\nLogin Status:", response.status)

    print("Login Success:", result.get("success"))

    token = result.get("token")

    if token:
        profile_request = urllib.request.Request(
            BASE_URL + "/me",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        with urllib.request.urlopen(
            profile_request, timeout=10
        ) as response:
            profile = json.load(response)
            print("Profile Status:", response.status)

        user = profile.get("user", {})

        print("Admin Role:", user.get("role"))
        print(
            "Protected Route:",
            "PASS" if profile.get("success") else "FAIL"
        )

except urllib.error.HTTPError as error:
    print("\nHTTP Status:", error.code)
    try:
        print("Message:", json.load(error).get("message"))
    except Exception:
        print("Request rejected")

except Exception as error:
    print("\nTest Error:", str(error))
