import React, {useState} from "react";
import history from "../history";
import {Router, Route, Switch} from 'react-router-dom';
import log from "loglevel"
import NavBar from "./routes/navbar/navBar";
import {TabPanelList} from "./routes/navbar/tabPanelList";
import Home from "./routes/home/home";
import SignIn from "./routes/signin/signIn";
import SignUp from "./routes/signup/signUp";
import Product from "./routes/product/product";
import ProductDetail from "./routes/detail/productDetails";
import Checkout from "./routes/checkout/checkout";
import ShoppingBag from "./routes/shoppingBag";
import {SuccessPayment} from "./routes/successPayment";
import {CancelPayment} from "./routes/cancelPayment";
import {BadRequest} from "./ui/error/badRequest";

const App = () => {
    log.info(`[App]: Rendering App Component`)
    const [serverError, setServerError] = useState(false);

    const setServerErrorHandler = () => {
        setServerError(true)
    }

    return (
        <Router history={history}>
            <NavBar errorHandler={setServerErrorHandler}/>
            <TabPanelList/>
            {serverError ? null: <Switch>
                <Route path="/" exact component={Home}/>
                <Route path="/signin" exact component={SignIn}/>
                <Route path="/signup" exact component={SignUp}/>
                <Route path="/shopping-bag" exact component={ShoppingBag}/>
                <Route path="/checkout" exact component={Checkout}/>
                <Route path="/products/details/shopping-bag" exact component={ShoppingBag}/>
                <Route path="/products/:details" exact component={ProductDetail}/>
                <Route path="/products" exact component={Product}/>
                <Route path="/checkout/success-payment/:id" exact component={SuccessPayment}/>
                <Route path="/checkout/cancel-payment/:id" exact component={CancelPayment}/>
                <Route path="*" exact component={BadRequest}/>
            </Switch>}
        </Router>
    )
}

export default App;