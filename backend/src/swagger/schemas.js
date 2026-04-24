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
 *         - name
 *         - unitPrice
 *         - inventoryLevel
 *       properties:
 *         _id:
 *           type: string
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         classification:
 *           type: string
 *           enum: [FOOTWEAR, ELECTRONICS, APPAREL, ACCESSORIES]
 *         unitPrice:
 *           type: number
 *         inventoryLevel:
 *           type: number
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         imageUrl:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *         specs:
 *           type: string
 *         category:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *         rating:
 *           type: number
 *         featured:
 *           type: boolean
 *         sizes:
 *           type: array
 *           items: { type: string }
 *         colors:
 *           type: array
 *           items: { type: string }
 *         salesCount:
 *           type: number
 * 
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         parent:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         productCount:
 *           type: number
 * 
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - contactName
 *         - phone
 *         - country
 *         - address
 *       properties:
 *         contactName:
 *           type: string
 *           example: Abebe Girma
 *         phone:
 *           type: string
 *           example: "+251911234567"
 *         country:
 *           type: string
 *           example: Ethiopia
 *         address:
 *           type: string
 *           example: "Bole Road, Addis Ababa"
 * 
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         quantity:
 *           type: number
 *           minimum: 1
 *         price:
 *           type: number
 *         size:
 *           type: string
 *           example: M
 *         color:
 *           type: string
 *           example: STANDARD BLACK
 * 
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - totalPrice
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         urgentDelivery:
 *           type: boolean
 *         urgentDeliveryFee:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [TELEBIRR, CHAPA, CASH_ON_DELIVERY, PENDING]
 *         paymentStatus:
 *           type: string
 *           enum: [UNPAID, PAID, FAILED, REFUNDED]
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 * 
 * 
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [REGULAR, PRIVILEGED, ADMIN, SUPER_ADMIN]
 *         status:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, PENDING]
 *         profilePicture:
 *           type: string
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShippingAddress'
 * 
 *     UserRegister:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           example: securePassword123
 *         confirmPassword:
 *           type: string
 *           example: securePassword123
 * 
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           example: securePassword123
 * 
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 * 
 *     ResetPassword:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         otp:
 *           type: string
 *           example: "123456"
 *         newPassword:
 *           type: string
 *           example: newSecurePassword123
 *         confirmPassword:
 *           type: string
 *           example: newSecurePassword123
 */

module.exports = {};
