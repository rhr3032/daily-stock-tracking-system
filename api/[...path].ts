import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../server/prisma';

type JsonResponse = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

interface BaseEntry {
	id: string;
	date: string;
	productId: string;
	quantity: number;
	createdAt: Date;
	product: { name: string };
}

interface SaleEntry extends BaseEntry {
	amount: number;
}

function sendJson(response: VercelResponse, statusCode: number, body: JsonResponse) {
	response.status(statusCode).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function formatOrder(order: BaseEntry) {
	return { ...order, productName: order.product.name };
}

function formatSale(sale: SaleEntry) {
	return { ...sale, productName: sale.product.name };
}

function formatDispatch(dispatch: BaseEntry) {
	return { ...dispatch, productName: dispatch.product.name };
}

function formatReturn(entry: BaseEntry) {
	return { ...entry, productName: entry.product.name };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (request.method === 'OPTIONS') {
		response.status(204).end();
		return;
	}

	const url = new URL(request.url || '/', 'http://localhost');
	const route = url.pathname.replace(/^\/api/, '') || '/';

	try {
		if (request.method === 'GET' && route === '/health') {
			const productCount = await prisma.product.count();
			sendJson(response, 200, { status: 'ok', database: 'connected', productCount });
			return;
		}

		if (request.method === 'GET' && route === '/bootstrap') {
			const [products, orders, sales, dispatches, returns] = await Promise.all([
				prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
				prisma.dailyOrder.findMany({ orderBy: { createdAt: 'desc' } }),
				prisma.dailySale.findMany({ orderBy: { createdAt: 'desc' } }),
				prisma.morningDispatch.findMany({ orderBy: { createdAt: 'desc' } }),
				prisma.dailyReturn.findMany({ orderBy: { createdAt: 'desc' } }),
			]);

			sendJson(response, 200, { products, orders, sales, dispatches, returns });
			return;
		}

		if (request.method === 'GET' && route === '/products') {
			const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
			sendJson(response, 200, products);
			return;
		}

		if (request.method === 'POST' && route === '/products') {
			const body = request.body as Partial<Record<string, unknown>>;
			const product = await prisma.product.create({
				data: {
					name: String(body.name ?? '').trim(),
					unit: body.unit ? String(body.unit).trim() : null,
					purchasePrice: Number(body.purchasePrice ?? 0),
					sellingPrice: Number(body.sellingPrice ?? 0),
					totalQuantity: Number(body.totalQuantity ?? 0),
					currentStock: Number(body.currentStock ?? body.totalQuantity ?? 0),
					lowStockThreshold: Number(body.lowStockThreshold ?? 10),
				},
			});

			sendJson(response, 201, product);
			return;
		}

		if (request.method === 'PUT' && route.startsWith('/products/')) {
			const id = route.split('/').filter(Boolean)[1];
			const product = await prisma.product.update({
				where: { id },
				data: request.body,
			});

			sendJson(response, 200, product);
			return;
		}

		if (request.method === 'DELETE' && route.startsWith('/products/')) {
			const id = route.split('/').filter(Boolean)[1];
			await prisma.product.delete({ where: { id } });
			response.status(204).end();
			return;
		}

		if (request.method === 'GET' && route === '/orders') {
			const orders = await prisma.dailyOrder.findMany({
				orderBy: { createdAt: 'desc' },
				include: { product: true },
			});
			sendJson(response, 200, orders.map(formatOrder));
			return;
		}

		if (request.method === 'POST' && route === '/orders') {
			const body = request.body as Partial<Record<string, unknown>>;
			const created = await prisma.dailyOrder.create({
				data: {
					date: String(body.date ?? ''),
					productId: String(body.productId ?? ''),
					quantity: Number(body.quantity ?? 0),
				},
			});
			sendJson(response, 201, created);
			return;
		}

		if (request.method === 'GET' && route === '/sales') {
			const sales = await prisma.dailySale.findMany({
				orderBy: { createdAt: 'desc' },
				include: { product: true },
			});
			sendJson(response, 200, sales.map(formatSale));
			return;
		}

		if (request.method === 'POST' && route === '/sales') {
			const body = request.body as Partial<Record<string, unknown>>;
			const created = await prisma.dailySale.create({
				data: {
					date: String(body.date ?? ''),
					productId: String(body.productId ?? ''),
					quantity: Number(body.quantity ?? 0),
					amount: Number(body.amount ?? 0),
				},
			});
			sendJson(response, 201, created);
			return;
		}

		if (request.method === 'GET' && route === '/dispatches') {
			const dispatches = await prisma.morningDispatch.findMany({
				orderBy: { createdAt: 'desc' },
				include: { product: true },
			});
			sendJson(response, 200, dispatches.map(formatDispatch));
			return;
		}

		if (request.method === 'POST' && route === '/dispatches') {
			const body = request.body as Partial<Record<string, unknown>>;
			const created = await prisma.$transaction(async (transaction) => {
				const product = await transaction.product.findUnique({ where: { id: String(body.productId ?? '') } });

				if (!product) {
					throw new Error('Product not found');
				}

				const quantity = Number(body.quantity ?? 0);
				if (quantity > product.currentStock) {
					throw new Error('Insufficient stock for dispatch');
				}

				await transaction.product.update({
					where: { id: product.id },
					data: { currentStock: product.currentStock - quantity },
				});

				return transaction.morningDispatch.create({
					data: {
						date: String(body.date ?? ''),
						productId: product.id,
						quantity,
					},
				});
			});

			sendJson(response, 201, created);
			return;
		}

		if (request.method === 'GET' && route === '/returns') {
			const returns = await prisma.dailyReturn.findMany({
				orderBy: { createdAt: 'desc' },
				include: { product: true },
			});
			sendJson(response, 200, returns.map(formatReturn));
			return;
		}

		if (request.method === 'POST' && route === '/returns') {
			const body = request.body as Partial<Record<string, unknown>>;
			const created = await prisma.$transaction(async (transaction) => {
				const product = await transaction.product.findUnique({ where: { id: String(body.productId ?? '') } });

				if (!product) {
					throw new Error('Product not found');
				}

				const quantity = Number(body.quantity ?? 0);
				const amount = Number(body.amount ?? 0);

				await transaction.product.update({
					where: { id: product.id },
					data: { currentStock: product.currentStock + quantity },
				});

				return transaction.dailyReturn.create({
					data: {
						date: String(body.date ?? ''),
						productId: product.id,
						quantity,
						amount,
					},
				});
			});

			sendJson(response, 201, created);
			return;
		}

		sendJson(response, 404, { message: 'Not found' });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unexpected server error';
		sendJson(response, 400, { message });
	}
}


