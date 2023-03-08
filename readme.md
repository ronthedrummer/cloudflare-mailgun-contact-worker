# Mailgun Worker for Cloudflare (Serverless Contact Form Router)

When building static websites, the biggest issue I have is making a contact form that sends emails to an address that I don't want to publish for the world to see. So, I decided to make a Cloudflare worker that routes my form data to Mailgun and sends emails to who you want to receive your contact forms.

Here's all the things you need to have your own contact submit worker on Cloudflare that sends messages to mailgun.

> **Note:** Make sure you setup some anti-bot stuff on your front-end like [`Google reCaptcha`](https://www.google.com/recaptcha/about/).

## Prerequisites

Both Cloudflare and Mailgun offer a free tier for you to get started.

1. Have a domain hosted on [`Cloudflare`](https://www.cloudflare.com).
2. Create a [`Mailgun`](https://www.mailgun.com) account.
3. Install the [`Wrangler CLI`](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and follow the [`login instructions`](https://developers.cloudflare.com/workers/wrangler/commands/#login).

## Setup

1. Setup Mailgun by adding your domain. I suggest adding a subdomain like `mail.mywebsite.com`. This makes setting up the DNS records on Cloudflare a little easier and avoid conflicts with your usual email provider.

2. Setup Cloudflare by adding the DNS records given to you by Mailgun. These records will tell the world that Mailgun can send emails on behalf of your domain and keep emails out of spam folders.

3. Setup a KV namespace with the variables mentioned below. You'll need a sending API key and the domain you setup with Mailgun. Make sure the domain used in your `FROM_EMAIL` and `MAILGUN_DOMAIN` match the domain you setup in Mailgun.

> **Note:** Replace `mail.mywebsite.com` with your domain.

```
FROM_EMAIL = contact@mail.mywebsite.com
MAILGIN_API_KEY = abc123xxxxabc1234
MAILGUN_BASE_URL = https://api.mailgun.net/v3/
MAILGUN_DOMAIN = mail.mywebsite.com
SUBJECT = Contact Form [My Website]
TO_EMAILS = me@mywebsite.com
CORS_ALLOW = *.mywebsite.com
```

## Install and Configure this repo

1. Install all the dependecies for this repo by running:

```sh
$ npm install
# or
$ yarn
```

2. Register the KV namespace ID in your `wrangler.toml` file. If you want to do both a dev and production instance, use all the fields in the file. If you only want a single production environment, replace the `wrangler.toml` file with the code below and update the values for the route pattern, route zone_name, and kv_namespaces id.

### Single Environment

```toml
name = "mailgun-contact-worker"
main = "src/index.ts"
compatibility_date = "2023-01-04"

route = {pattern = "www.mywebsite.com/contact-submit", zone_name = "mywebsite.com"}
kv_namespaces = [
    { binding = "VARS", id = "" }
]
```

3. Publish the project to Cloudflare. In your terminal, run:

```
wrangler publish
```

4. Make sure the worker route is registered in Cloudflare's UI. Make sure you have the DNS proxied through cloudflare and not just 'DNS Only'.

> **Note:** You may need to make your route a subdomain to avoid conflicting with your website. I've used `contact.mywebsite.com/contact-submit` so that I can use a proxied A record for that subdomain and point it to `1.2.3.4`. This is a hack to make Cloudflare route all traffic for that subdomain to workers.

5. Have fun!
