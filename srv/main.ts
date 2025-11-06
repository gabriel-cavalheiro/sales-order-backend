import cds, { db, Request, Service } from '@sap/cds';
import { Customers, Product, Products, SalesOrderItem } from '@models/sales';

export default (service: Service) => {
    service.after('READ', 'Customers', (results: Customers) => {
        results.forEach(customer => {
            if (!customer.email?.includes('@')) {
                customer.email = `${customer.email}@gmail.com`;
            }
        });
    });

    service.before('CREATE', 'SalesOrderHeaders', async (request: Request) => {
        const params = request.data;
        const items: SalesOrderItem = params.items;

        if (!params.customer_id) {
            return request.reject(400, 'Customer Inválido');
        }

        if (!params.items || params.items?.length === 0) {
            return request.reject(400, 'Sales Order deve ter ao menos um item');
        }

        const customerQuery = SELECT.one.from('sales.Customers').where({ id: params.customer_id });

        const customer = await cds.run(customerQuery);

        if (!customer) {
            return request.reject(404, 'Customer Não Encontrado');
        }

        const productsId: string[] = params.items?.map((item: SalesOrderItem) => item.product_id);
        const productsQuery = SELECT.from('sales.Products').where({ id: productsId });
        const products: Products = await cds.run(productsQuery);
        const dbProducts = products.map((product) => product.id);

        for (const item of params.items) {
            const dbProduct = products.find( product => product.id === item.product_id);
            
            if (!dbProduct) {
                return request.reject(404, `Produto ${item.product_id} não foi encontrado`);
            }       


        if (dbProduct.stock === 0) {
            return request.reject(400, `Produto ${dbProduct.id} sem estoque disponível`);
        }

    };
} )};