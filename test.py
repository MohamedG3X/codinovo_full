import requests
jwt ="<JWT>"
payload = {"phone":"201019779739", "username":"qq", "password":"qq"}
r = requests.post("http://localhost:4000/api/otp/send", json=payload, headers={
"Authorization": f"Bearer {jwt}", "Content-Type": "application/json" })
print(r.json())