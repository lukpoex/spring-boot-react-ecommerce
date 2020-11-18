import React, {useState} from 'react';
import log from 'loglevel';
import BreadcrumbsSection from "../ui/breadcrumbs";
import {MAX_PRODUCTS_PER_PAGE} from "../../constants/constants";
import history from "../../history";
import Box from "@material-ui/core/Box";
import {useDispatch, useSelector} from "react-redux";
import Cookies from "js-cookie";
import {ADD_TO_CART, CART_TOTAL} from "../../actions/types";
import DropdownSection from "../ui/dropDown";
import {Button, Divider, Grid, Paper} from "@material-ui/core";
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import {connect} from "react-redux";
import {getDataViaAPI} from '../../actions';
import Spinner from "../ui/spinner";
import {EmptyShoppingBag} from "../ui/error/emptyShoppingBag";
import {HTTPError} from "../ui/error/httpError";
import PriceDetails from "./priceDetails";
import _ from 'lodash';
import Hidden from "@material-ui/core/Hidden";
import {useAddProductsToShoppingBag} from "../../hooks/useAddProductsToShoppingBag";
import {CART_TOTAL_COOKIE, SHOPPERS_PRODUCT_INFO_COOKIE} from "../../constants/cookies";
import {HOME_ROUTE} from "../../constants/react_routes";
import {DocumentTitle} from "../ui/documentTitle";
import {ModalConfirmation} from "../ui/modalConfirmation";

function ShoppingBag(props) {
    const addToCart = useSelector(state => state.addToCartReducer)
    const shoppingBagProducts = useSelector(state => state.shoppingBagProductReducer)
    const dispatch = useDispatch()
    const [itemRemovalModalState, setItemRemovalModalState] = useState({active: false, productId: null})
    let cartTotal = 0

    useAddProductsToShoppingBag(props.getDataViaAPI)

    const getStringBeforeLastDelimiter = (str, delimiter) => {
        return str.substring(0, str.lastIndexOf(delimiter))
    }

    const breadcrumbLinks = [
        {
            name: 'Home',
            link: HOME_ROUTE
        },
        {
            name: 'Products',
            link: `${getStringBeforeLastDelimiter(history.location.pathname, "/details")
            + getStringBeforeLastDelimiter(history.location.search, "::")}`
        },
        {
            name: 'Details',
            link: getStringBeforeLastDelimiter(history.location.pathname, "/")
                + history.location.search
        },
        {
            name: 'ShoppingBag',
            link: '/shopping-bag'
        },
    ]

    const getQuantityList = () => {
        let qtyList = []
        for (let i = 1; i <= 10; ++i) {
            qtyList.push({
                id: i,
                type: i
            })
        }
        return qtyList
    }

    const getCartTotal = () => {
        log.info(`[ShoppingBag] ShoppingBag = ${JSON.stringify(shoppingBagProducts)}`)
        log.info(`[ShoppingBag] addToCart = ${JSON.stringify(addToCart)}`)
        if (shoppingBagProducts.data && Object.keys(addToCart.productQty).length > 0) {
            for (const [id, qty] of Object.entries(addToCart.productQty)) {
                if (shoppingBagProducts.data.hasOwnProperty(id)) {
                    cartTotal += qty * shoppingBagProducts.data[id].price
                }
            }
        }

        Cookies.set(CART_TOTAL_COOKIE, cartTotal, {expires: 7});

        dispatch({
            type: CART_TOTAL,
            payload: cartTotal
        })

        return cartTotal
    }

    const onQtyDropdownChangeHandler = (value, text, id) => {
        log.info(`[ShoppingBag] onChangeHandler id = ${id}, value = ${value}`)
        let newAddToCart = addToCart
        newAddToCart.productQty[id] = value

        Cookies.set(SHOPPERS_PRODUCT_INFO_COOKIE, newAddToCart, {expires: 7});
        dispatch({
            type: ADD_TO_CART,
            payload: newAddToCart
        })
    }

    const removeConfirmBtnClickHandler = () => {
        setItemRemovalModalState({active: false, productId: null})
        if (itemRemovalModalState.productId) {
            let newAddToCart = addToCart
            newAddToCart.totalQuantity -= newAddToCart.productQty[itemRemovalModalState.productId]
            newAddToCart.productQty = _.omit(newAddToCart.productQty, itemRemovalModalState.productId)
            Cookies.set(SHOPPERS_PRODUCT_INFO_COOKIE, newAddToCart, {expires: 7});
            dispatch({
                type: ADD_TO_CART,
                payload: newAddToCart
            })
        }
    }

    const closeModalClickHandler = () => {
        setItemRemovalModalState({active: false, productId: null})
    }

    const removeBtnClickHandler = id => () => {
        log.info(`[ShoppingBag] removeBtnChangeHandler id = ${id}`)
        setItemRemovalModalState({active: true, productId: id})
    }

    const wannaShopBtnClick = () => {
        history.push(`/products?q=page=0,${MAX_PRODUCTS_PER_PAGE}`);
    }

    if (shoppingBagProducts.isLoading) {
        return <Spinner/>
    } else {
        if (shoppingBagProducts.hasOwnProperty("data")) {
            if (Object.keys(shoppingBagProducts.data).length === 0) {
                return <EmptyShoppingBag btnHandler={wannaShopBtnClick}/>
            }
        } else {
            if (shoppingBagProducts.hasOwnProperty('statusCode')) {
                log.info(`[ShoppingBag]: ShoppingBag.statusCode = ${shoppingBagProducts.statusCode}`)
                return <HTTPError statusCode={shoppingBagProducts.statusCode}/>
            }
        }
    }

    const renderShoppingBagProducts = () => {
        log.trace(`[ShoppingBag] ShoppingBag = ${JSON.stringify(shoppingBagProducts)}`)

        if(Object.keys(addToCart.productQty).length === 0) {
            return null
        }

        let shoppingBagProductsList = []

        for (const [id, product] of Object.entries(shoppingBagProducts.data)) {

            shoppingBagProductsList.push(
                <Grid item container key={product.id} style={{border: '1px solid #eaeaec', margin: "1rem 0"}}>
                    <Grid item container justify="center" xs={5} sm={3}>
                        <img src={product.imageURL} alt={product.name}
                             style={{height: "90%", width: "80%", paddingTop: "1rem"}}/>
                    </Grid>

                    <Grid item container xs={7} sm={9}>
                        <Grid item container direction="column" sm={6} spacing={1}>
                            <Grid item container style={{fontSize: "1.1rem", fontWeight: 600, paddingTop: "1rem"}}>
                                <Grid item xs={7}>
                                    {product.productBrandCategory.type}
                                </Grid>
                            </Grid>

                            <Grid item style={{fontSize: "1.1rem", fontWeight: 300}}>
                                {product.name}
                            </Grid>

                            <Grid item style={{fontSize: "0.85rem", color: "#94969f"}}>
                                Sold by
                            </Grid>

                            <Grid item>
                                <DropdownSection
                                    attrList={getQuantityList(id)}
                                    selectedValue={addToCart.productQty.hasOwnProperty(id) ? {
                                        id: id,
                                        value: addToCart.productQty[id]
                                    } : 1}
                                    appendText="Qty:"
                                    title={id}
                                    size="sm"
                                    onChangeHandler={onQtyDropdownChangeHandler}/>
                            </Grid>
                        </Grid>

                        <Grid item container justify="flex-end" sm={6} style={{padding: "1rem 1rem 0 0",
                            fontWeight: "bold", fontSize: "1.1rem"}}>
                            {`Qty: ${addToCart.productQty[product.id]} x $${product.price} = `
                            + `$${addToCart.productQty[product.id] * product.price}`}
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider/>
                    </Grid>

                    <Grid item container justify="flex-end" style={{padding: "0.5rem 0.7rem 0.5rem 0"}}>
                        <Grid item sm={3}>
                            <Button variant="contained" size="medium" color="secondary"
                                    style={{width: "100%"}}
                                    onClick={removeBtnClickHandler(id)}
                                    startIcon={<RemoveCircleOutlineIcon/>}>
                                Remove
                            </Button>
                        </Grid>
                    </Grid>

                </Grid>
            )
        }

        return shoppingBagProductsList
    }

    const continueBtnClickHandler = () => {
        history.push("/checkout")
    }

    log.info("[ShoppingBag] Rendering ShoppingBag Component.")

    return (
        <>
            <DocumentTitle title="Shopping Bag"/>

            <Box display="flex" p={3}>
                <BreadcrumbsSection linkList={breadcrumbLinks}/>
            </Box>

            <Grid container justify="center" style={{height: "100%"}}>
                <Grid item xs={12} sm={11} md={7}>

                    <Divider/>

                    <Grid item container justify="center" style={{fontSize: '1.2rem', fontWeight: 600, padding: "1rem 0.5rem"}}>
                        <Grid item xs={8}>
                            {`My Shopping Bag (${addToCart.totalQuantity} Items)`}
                        </Grid>

                        <Grid item container xs={4} justify="flex-end">
                            {`Total: $${getCartTotal()}`}
                        </Grid>
                    </Grid>

                    {renderShoppingBagProducts()}
                </Grid>

                <Hidden smDown>
                    <Grid item style={{ padding: "0 2rem"}}>
                        <Divider orientation="vertical" style={{height: "100%", width: 1}}/>
                    </Grid>
                </Hidden>

                <Grid item sm={8} md={3}>
                    <Paper square style={{width: "inherit", position: "sticky", top: 80}}>
                        <PriceDetails buttonName="Proceed To Checkout" onBtnClickHandler={continueBtnClickHandler}/>

                        <Grid item container xs={12} sm={12} justify="center"
                              style={{fontColor: "#535766", fontWeight: "bolder", fontSize: "1.2rem", padding: "20px 0"}}>
                            <Button variant="contained" size="medium"
                                    onClick={continueBtnClickHandler}
                                    style={{
                                        width: '70%', height: 50, color: 'white',
                                        fontWeight: "bold", backgroundColor: "#e01a2b",
                                        fontSize: "1rem"
                                    }}>
                                Proceed To Checkout
                            </Button>
                        </Grid>

                    </Paper>
                </Grid>
            </Grid>

            {itemRemovalModalState.active ? <ModalConfirmation
                                                    title="Remove Item"
                                                    question="Are you sure you want to remove this item?"
                                                    removeConfirmedHandler={removeConfirmBtnClickHandler}
                                                    closeModalHandler={closeModalClickHandler}/> : null}
        </>
    )
}

export default connect(null, {getDataViaAPI})(ShoppingBag);