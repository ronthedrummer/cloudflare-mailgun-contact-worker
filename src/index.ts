/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface FormData {
    name: string;
    email: string;
    phone: string;
    message: string;
}

export interface Env {
    VARS: KVNamespace;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        try {
            const KV = env.VARS;
            const CORS_ALLOW = await KV.get('CORS_ALLOW');

            if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
                const res = await handleContactSubmit(request, env);
                if (res.hasOwnProperty('data')) {
                    return new Response(JSON.stringify(res.data), { status: 200 })
                }
                return new Response(`didn't get data back from the handler: ${res}`)
            } else if (request.method === 'OPTIONS') {
                const responseHeaders = new Headers({
                    'User-Agent': 'Cloudflare Workers',
                    'Access-Control-Allow-Origin': CORS_ALLOW
                })
                return new Response(`this should work`, {
                    headers: responseHeaders,
                    status: 200,
                    statusText: `this should work`
                })
            } else {
                return new Response(`Ain't got the data`, { status: 400 });
            }
        } catch (err) {
            console.log(err)
            return new Response(`nope catch`)
        }
    },
};

async function handleContactSubmit(req: Request, env: Env) {
    const data: any = await req.json();
    const formData = new FormData();
    const KV = env.VARS;

    const MAILGIN_API_KEY = await KV.get('MAILGIN_API_KEY');
    const MAILGUN_BASE_URL = await KV.get('MAILGUN_BASE_URL');
    const MAILGUN_DOMAIN = await KV.get('MAILGUN_DOMAIN');
    const TO_EMAILS = await KV.get('TO_EMAILS');
    const FROM_EMAIL = await KV.get('FROM_EMAIL');
    const SUBJECT = await KV.get('SUBJECT');

    const html = `
        <h2 style="margin:0 0 2em 0;">New Contact Form Submission</h2>
        <ul style="padding:0 0 0 1em;font-size: 1.2em;">
            <li style="list-style-type:none;">name: ${data.name || 'not provided'}</li>
            <li style="list-style-type:none;">email: ${data.email}</li>
            <li style="list-style-type:none;">phone: ${data.phone}</li>
            <li style="list-style-type:none;">message: ${data.message}</li>
        </ul>
    `

    const body = `
        New Contact Form Submission\n
        \tname: ${data.name || 'not provided'}\n
        \temail: ${data.email}\n
        \tphone: ${data.phone}\n
        \tmessage: ${data.message}`;

    if (data.hasOwnProperty('email')) {
        formData.append('to', TO_EMAILS);
        formData.append('from', FROM_EMAIL);
        formData.append('subject', SUBJECT);
        formData.append('text', body);
        formData.append('html', html);

        console.log(JSON.stringify(formData))

        try {
            const response = await fetch(
                `${MAILGUN_BASE_URL}${MAILGUN_DOMAIN}/messages`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${btoa('api:' + MAILGIN_API_KEY)}`,
                    },
                    body: formData,
                }
            );

            return { data: response };
        } catch (err) {
            return 'error submitting data'
        }
    } else {
        return { message: `That doesn't work either`, status: 400 }
    }
}
