const FactoryDAO = require('../daos/index')
const DAO = FactoryDAO()
const nodemailer = require('nodemailer')
const email_notification = process.env.EMAIL_NOTIFICATION
const email_pass = process.env.EMAIL_PASS

const getCartsController = async (req, res) => {
    try {
        if (!req.session.username) {
            res.render('login.ejs', {})
        } else {
            const cart = await DAO.cart.getAll()
            const userCart = cart[0] ? cart[0].products : undefined
            res.render('carts.ejs', {
                userCart
            })
        }
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}
//add product to cart
const postCartsController = async (req, res) => {
    try {
        const {
            addID
        } = req.body
        const productToAdd = await DAO.product.getByID(addID)
        if (productToAdd.length > 0) {
            if (productToAdd[0].stock > 0) {
                const editedProduct = {
                    ...productToAdd[0],
                    _doc: {
                        ...productToAdd[0]._doc,
                        stock: productToAdd[0].stock - 1
                    }
                }
                await DAO.product.editById(editedProduct, addID)
                res.send(await DAO.cart.insertProductInCart(productToAdd, req.session.cartId))
            }
        } else {
            res.send({
                error: 'The product does not belong to our inventory.'
            })
        }
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}

const getPurchaseCartsController = async (req, res) => {
    try {
        if (!req.session.username) {
            res.render('login.ejs', {})
        } else {
            res.render('purchase.ejs')
        }
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}
//delete all products from cart
const deleteCartsController = async (req, res) => {
    try {
        const cartId = req.session.cartId

        const cartToReturn = await DAO.cart.getByID(cartId)
        await cartToReturn[0].products.map(async (prod) => {
            const productToEdit = await DAO.product.getByID(prod._id)
            const editedProduct = {
                ...productToEdit[0],
                _doc: {
                    ...productToEdit[0]._doc,
                    stock: productToEdit[0].stock + 1
                }
            }
            await DAO.product.editById(editedProduct, prod._id)
        })

        await DAO.cart.deleteAllProductsInCart(cartId)
        res.send('Cart deleted')
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}
//delete product from cart
const deleteByIdCartsController = async (req, res) => {
    try {
        const prodId = req.params.id
        await DAO.cart.deleteProductInCart(req.session.cartId, prodId)

        const productToEdit = await DAO.product.getByID(prodId)
        const editedProduct = {
            ...productToEdit[0],
            _doc: {
                ...productToEdit[0]._doc,
                stock: productToEdit[0].stock + 1
            }
        }
        await DAO.product.editById(editedProduct, prodId)

        res.send(`Product with ID #${prodId} deleted from cart.`)
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}
//send email with cart products
const postOrderCartsController = async (req, res) => {
    try {
        const cart = await DAO.cart.getAll()

        DAO.order.orderSave(cart)
            .then((order) => {
                const transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    auth: {
                        user: email_notification,
                        pass: email_pass
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                })
                const purchased = order[0].map(prod => {
                    return prod.title
                }).join(', ')
                transporter.sendMail({
                        from: email_notification,
                        to: [email_notification, req.session.userObject.email],
                        subject: 'New order generated',
                        html: `
                        <h2>Order created by: ${req.session.username}</h2>
                        <p>Purchased products: ${purchased}</p>
                    `
                    })
                    .then(res => console.log(res))
                    .catch(err => console.log(err))
                DAO.cart.deleteAllProductsInCart(req.session.cartId)
                res.send('Order sent')
            })
    } catch (error) {
        res.render('error.ejs', {
            error
        })
    }
}

module.exports = {
    getCartsController,
    postCartsController,
    deleteCartsController,
    deleteByIdCartsController,
    postOrderCartsController,
    getPurchaseCartsController
}