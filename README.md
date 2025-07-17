# Quickstart

## Installation
Clone the repository

```js
git clone https://github.com/mercurjs/vendor-panel.git
```
&nbsp;

Go to directory
```js
cd vendor-panel
```
&nbsp;

Install dependencies
```js
npm install
```
&nbsp;

Make a .env.local file and copy the code below
```js
VITE_MEDUSA_BASE='/'
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_PUBLISHABLE_API_KEY=<your publishable api key here>
VITE_TALK_JS_APP_ID=<talkjs public key here>
VITE_DISABLE_SELLERS_REGISTRATION=false 
```
&nbsp;

Start storefront
```js
npm run dev
```