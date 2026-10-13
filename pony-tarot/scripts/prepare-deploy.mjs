import { access, cp } from 'node:fs/promises';

const app = new URL('../', import.meta.url);
const standalone = new URL('.next/standalone/', app);
await access(new URL('server.js', standalone));
await cp(new URL('public/', app), new URL('public/', standalone), { recursive: true });
await cp(new URL('.next/static/', app), new URL('.next/static/', standalone), { recursive: true });
console.log('部署目录已准备：.next/standalone（包含卡面、家园、字体和静态资源）。');
console.log('用户数据库与加密主密钥不在此目录；部署时单独配置持久路径和环境变量。');
