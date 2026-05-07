import cors from 'cors';
import express from 'express';
import { prisma } from './prisma';

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

interface ReturnEntry extends BaseEntry {
  amount: number;
}

interface ProductRequestBody {
  name?: unknown;
  unit?: unknown;
  purchasePrice?: unknown;
  sellingPrice?: unknown;
  totalQuantity?: unknown;
  currentStock?: unknown;
  lowStockThreshold?: unknown;
}

interface EntryRequestBody {
  date?: unknown;
  productId?: unknown;
  quantity?: unknown;
}

interface SaleRequestBody extends EntryRequestBody {
  amount?: unknown;
}

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request: express.Request, response: express.Response) => {
  const productCount = await prisma.product.count();
  response.json({ status: 'ok', database: 'connected', productCount });
});

app.get('/api/bootstrap', async (_request: express.Request, response: express.Response) => {
  try {
    const [products, orders, sales, dispatches, returns] = await Promise.all([
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailyOrder.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailySale.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.morningDispatch.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailyReturn.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    response.json({ products, orders, sales, dispatches, returns });
  } catch (error) {
    console.error('Bootstrap error:', error);
    throw error;
  }
});

app.get('/api/products', async (_request: express.Request, response: express.Response) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  response.json(products);
});

app.post('/api/products', async (request: express.Request<unknown, unknown, ProductRequestBody>, response: express.Response) => {
  const body = request.body;
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

  response.status(201).json(product);
});

app.put('/api/products/:id', async (request: express.Request<{ id: string }>, response: express.Response) => {
  const product = await prisma.product.update({
    where: { id: request.params.id },
    data: request.body,
  });

  response.json(product);
});

app.delete('/api/products/:id', async (request: express.Request<{ id: string }>, response: express.Response) => {
  await prisma.product.delete({ where: { id: request.params.id } });
  response.status(204).send();
});

app.get('/api/orders', async (_request: express.Request, response: express.Response) => {
  const orders = await prisma.dailyOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });
  response.json(orders.map(formatOrder));
});

app.post('/api/orders', async (request: express.Request<unknown, unknown, EntryRequestBody>, response: express.Response) => {
  const body = request.body;
  const created = await prisma.dailyOrder.create({
    data: {
      date: String(body.date ?? ''),
      productId: String(body.productId ?? ''),
      quantity: Number(body.quantity ?? 0),
    },
  });
  response.status(201).json(created);
});

app.get('/api/sales', async (_request: express.Request, response: express.Response) => {
  const sales = await prisma.dailySale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });
  response.json(sales.map(formatSale));
});

app.post('/api/sales', async (request: express.Request<unknown, unknown, SaleRequestBody>, response: express.Response) => {
  const body = request.body;
  const created = await prisma.dailySale.create({
    data: {
      date: String(body.date ?? ''),
      productId: String(body.productId ?? ''),
      quantity: Number(body.quantity ?? 0),
      amount: Number(body.amount ?? 0),
    },
  });
  response.status(201).json(created);
});

app.get('/api/dispatches', async (_request: express.Request, response: express.Response) => {
  const dispatches = await prisma.morningDispatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });
  response.json(dispatches.map(formatDispatch));
});

app.post('/api/dispatches', async (request: express.Request<unknown, unknown, EntryRequestBody>, response: express.Response) => {
  const body = request.body;
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

  response.status(201).json(created);
});

app.get('/api/returns', async (_request: express.Request, response: express.Response) => {
  const returns = await prisma.dailyReturn.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });
  response.json(returns.map(formatReturn));
});

app.post('/api/returns', async (request: express.Request<unknown, unknown, SaleRequestBody>, response: express.Response) => {
  const body = request.body;
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

  response.status(201).json(created);
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  response.status(400).json({ message });
});

app.listen(port, () => {
  console.log(`Prisma backend listening on http://localhost:${port}`);
});

function formatOrder(order: BaseEntry) {
  return { ...order, productName: order.product.name };
}

function formatSale(sale: SaleEntry) {
  return { ...sale, productName: sale.product.name };
}

function formatDispatch(dispatch: BaseEntry) {
  return { ...dispatch, productName: dispatch.product.name };
}

function formatReturn(entry: ReturnEntry) {
  return { ...entry, productName: entry.product.name };
}