const { Router } = require('express')
const router = Router()
const user = require('../controllers/user.controller')

//login
router.get('/', user.getUserLogin)
router.post('/', user.postUserLogin)

router.get('/home', user.getHome)
//user page
router.get('/profile', user.getUserProfilePage)
//logout
router.get('/logout', user.getUserLogout)
//register
router.get('/register', user.getRegister)
router.post('/register', user.postRegister)

module.exports = router