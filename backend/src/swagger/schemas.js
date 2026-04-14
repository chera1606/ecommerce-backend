/**
 * @openapi
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *         message:
 *           type: string
 * 
 *     Product:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - unitPrice
 *         - inventoryLevel
 *       properties:
 *         sku:
 *           type: string
 *           description: Unique Stock Keeping Unit
 *         name:
 *           type: string
 *         classification:
 *           type: string
 *           enum: [FOOTWEAR, ELECTRONICS, APPAREL, ACCESSORIES]
 *         unitPrice:
 *           type: number
 *         inventoryLevel:
 *           type: number
 *         color:
 *           type: string
 *         imageUrl:
 *           type: string
 *         specs:
 *           type: string
 *         id:
 *           type: string
 *           description: QB-XXXX formatted ID
 * 
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 * 
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, SHIPPED, DELIVERED]
 *         priority:
 *           type: boolean
 * 
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [REGULAR, PRIVILEGED, ADMIN]
 *         status:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, PENDING]
 */

module.exports = {};
