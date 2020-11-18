import {
    HANDLE_SIGN_IN,
    HANDLE_SIGN_UP_ERROR,
    HANDLE_SIGN_OUT,
    HANDLE_SIGN_IN_ERROR,
    LOAD_FILTER_PRODUCTS,
    LOAD_FILTER_ATTRIBUTES,
    SHIPPING_ADDRESS_CONFIRMED,
    PAYMENT_INFO_CONFIRMED,
    PAYMENT_RESPONSE,
    HANDLE_GOOGLE_AUTH_SIGN_IN,
    HANDLE_GOOGLE_AUTH_SIGN_OUT,
    PAYMENT_RESPONSE_ERROR, SEARCH_KEYWORD_ERROR, SEARCH_KEYWORD,
} from './types';
import {INTERNAL_SERVER_ERROR_CODE, BAD_REQUEST_ERROR_CODE} from '../constants/http_error_codes'
import {SHOPPERS_PRODUCT_INFO_COOKIE, CART_TOTAL_COOKIE, AUTH_DETAILS_COOKIE} from '../constants/cookies'
import history from "../history";
import {Base64} from 'js-base64';
import Cookies from 'js-cookie';
import log from "loglevel";
import {commonServiceAPI, authServiceAPI, searchSuggestionServiceAPI} from "../api/service_api";
import axios from 'axios';
import {DEFAULT_SEARCH_SUGGESTION_API, SEARCH_SUGGESTION_API} from "../constants/api_routes";

export const setAuthDetailsFromCookie = savedResponse => {
    log.info(`[ACTION]: setTokenFromCookie savedResponse = ${savedResponse}`)
    return {
        type: HANDLE_SIGN_IN,
        payload: savedResponse
    }
}

export const setShippingAddress = payload => {
    log.info(`[ACTION]: setShippingAddress payload = ${JSON.stringify(payload)}`)
    return {
        type: SHIPPING_ADDRESS_CONFIRMED,
        payload: payload
    }
}

export const setPaymentInfo = payload => {
    log.info(`[ACTION]: setPaymentInfo payload = ${JSON.stringify(payload)}`)
    return {
        type: PAYMENT_INFO_CONFIRMED,
        payload: payload
    }
}

export const signIn = formValues => async dispatch => {
    log.info(`[ACTION]: signIn API is invoked formValues = ${formValues}`)

    const hash = Base64.encode(`${formValues.username}:${formValues.password}`);
    authServiceAPI.defaults.headers.common['Authorization'] = `Basic ${hash}`
    const response = await authServiceAPI.post('/authenticate').catch(err => {
        log.info(`[ACTION]: dispatch HANDLE_SIGN_IN_ERROR err.message = ${err.message}`)
        dispatch({type: HANDLE_SIGN_IN_ERROR, payload: err.message});
    });

    if (response) {
        if (response.data.jwt) {
            log.info(`[ACTION]: dispatch HANDLE_SIGN_IN response.data.jwt = ${response.data.jwt}`)
            dispatch({type: HANDLE_SIGN_IN, payload: response.data});
            Cookies.set(AUTH_DETAILS_COOKIE, response.data, {expires: 2});
            history.push('/');
        } else {
            log.info(`[ACTION]: dispatch HANDLE_SIGN_IN_ERROR response.data.error = ${response.data.error}`)
            dispatch({type: HANDLE_SIGN_IN_ERROR, payload: response.data.error});
        }
    }
}

export const signOut = () => {
    log.info(`[ACTION]: signOut Cookie is removed...`)
    Cookies.remove(AUTH_DETAILS_COOKIE)
    return {
        type: HANDLE_SIGN_OUT
    }
}

export const signInUsingOAuth = googleAuth => async dispatch => {
    log.info(`[signInUsingOAuth] googleAuth = ${googleAuth}`)

    // check if not signed in
    if (googleAuth && !googleAuth.isSignedIn.get()) {
        log.info('[signInUsingOAuth] User has not signed in yet')

        // sign in
        googleAuth.signIn(JSON.parse(googleAuth.currentUser.get().getId())).then(async () => {

                // if sign in works
                if (googleAuth.isSignedIn.get()) {
                    log.info('[signInUsingOAuth] User is signed in successfully')

                    dispatch({
                        type: HANDLE_GOOGLE_AUTH_SIGN_IN,
                        payload: {
                            firstName: googleAuth.currentUser.get().getBasicProfile().getGivenName(),
                            oAuth: googleAuth
                        }
                    })
                    history.push("/");

                    // try {
                    // let userProfile = googleAuth.currentUser.get().getBasicProfile()
                    // if (userProfile) {
                    //     const response = await authServiceAPI.post('/signin-using-google-auth', {
                    //         'id': userProfile.getId(),
                    //         'firstname': userProfile.getGivenName(),
                    //         'lastname': userProfile.getFamilyName(),
                    //         'email': userProfile.getEmail(),
                    //         'username': null,
                    //         'password': null,
                    //     }).catch(err => {
                    //         log.info(`[ACTION]: signUp dispatch HANDLE_SIGN_UP_ERROR err.message = ${err.message}.`)
                    //     });
                    //
                    //     if(response.data === "success") {
                    //         // here we are sure that we signed in and now dispatch.
                    //         dispatch({
                    //             type: HANDLE_GOOGLE_AUTH_SIGN_IN,
                    //             payload: {
                    //                 oAuth: googleAuth
                    //             }
                    //         })
                    //         history.push("/");
                    //     } else {
                    //         dispatch({type: HANDLE_SIGN_IN_ERROR, payload: response.data.error});
                    //     }

                    // dispatch({
                    //     type: HANDLE_GOOGLE_AUTH_SIGN_IN,
                    //     payload: {
                    //         oAuth: googleAuth
                    //     }
                    // })
                    // history.push("/");
                    // }
                    // } catch
                    //     (e) {
                    //     log.info(`[signInUsingOAuth] Unable to retrieve user profile.`)
                    //     dispatch({type: HANDLE_SIGN_IN_ERROR, payload: "Unable to retrieve user profile."});
                    // }
                }
            }
        )
    }
}

export const signOutUsingOAuth = googleAuth => async dispatch => {
    log.info(`[signOutUsingOAuth] googleAuth = ${googleAuth}, ` +
        `googleAuth.isSignedIn.get() = ${googleAuth.isSignedIn.get()}`)

    // if signed in then only try to sign out
    if (googleAuth && googleAuth.isSignedIn.get()) {

        log.info(`[signOutUsingOAuth] trying to signout`)
        googleAuth.signOut().then(() => {
            if (!googleAuth.isSignedIn.get()) {
                log.info(`[signOutUsingOAuth] Successfully signed out`)
                dispatch({
                    type: HANDLE_GOOGLE_AUTH_SIGN_OUT,
                    payload: null
                })
            }
        });
    }
}

export const signUp = formValues => async dispatch => {
    log.info(`[ACTION]: signUp API = ${JSON.stringify(formValues)}.`)

    const response = await authServiceAPI.post('/signup', {
        'username': formValues.username,
        'password': formValues.password,
        'firstname': formValues.firstName,
        'lastname': formValues.lastName,
        'email': formValues.email.toLowerCase(),
    }).catch(err => {
        log.info(`[ACTION]: signUp dispatch HANDLE_SIGN_UP_ERROR err.message = ${err.message}.`)
        dispatch({type: HANDLE_SIGN_UP_ERROR, payload: err.message});
    });

    if (response) {
        if (response.data.account_creation_status === 'success') {
            log.info(`[ACTION]: dispatch HANDLE_SIGN_UP account_creation_status = ${response.data.account_creation_status}.`)
            history.push("/signin");
        } else {
            console.log('response.data.error_msg = ' + response.data.error_msg);
            log.info(`[ACTION]: dispatch HANDLE_SIGN_UP_ERROR response.data.error_msg = ${response.data.error_msg}.`)
            dispatch({type: HANDLE_SIGN_UP_ERROR, payload: response.data.error_msg});
        }
    }
}

export const sendPaymentToken = (token) => async dispatch => {
    log.info(`Token = ${JSON.stringify(token)}`)
    if (!token || (token && !token.hasOwnProperty("id"))) {
        dispatch({
            type: PAYMENT_RESPONSE_ERROR,
            payload: {errorMsg: "Unable to fetch token. Try again later"}
        })
    }

    let url
    if (process.env.REACT_APP_PAYMENT_SERVICE_URL) {
        url = `${process.env.REACT_APP_PAYMENT_SERVICE_URL}/payment`
    } else {
        url = `http://localhost:${process.env.REACT_APP_PAYMENT_SERVICE_PORT}/payment`
    }

    let config = {
        method: 'post',
        url: url,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(token)
    };

    log.info(`URL = ${config.url}`)

    axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            let paymentResponse = {
                ...response.data,
                last4: token.card.last4, exp_year: token.card.exp_year,
                exp_month: token.card.exp_month, brand: token.card.brand
            }

            if (paymentResponse.payment_failed) {
                history.push(`/checkout/cancel-payment/${response.data.charge_id}`)
            } else {
                history.push(`/checkout/success-payment/${response.data.charge_id}`)
                Cookies.remove(CART_TOTAL_COOKIE)
                Cookies.remove(SHOPPERS_PRODUCT_INFO_COOKIE)
            }

            dispatch({
                type: PAYMENT_RESPONSE,
                payload: {...paymentResponse, error: false, errorMsg: null}
            })

        })
        .catch(function (error) {
            log.error(`[sendPaymentToken]: Error = ${error} `)
            dispatch({
                type: PAYMENT_RESPONSE_ERROR,
                payload: {errorMsg: "Something Went Wrong"}
            })
        });
}


export const getDataViaAPI = (type, route, query, synchronous = true) => async dispatch => {
    if (route) {
        if (query) {
            route += query
        }

        log.info(`[ACTION]: invokeAndDispatchAPIData Calling API = ${route}.`)
        let isFetchError = false
        if (synchronous) {
            await commonServiceAPI.get(route)
                .then(response => processResponse(response, query, type, route))
                .catch(err => {
                    isFetchError = true
                });
        } else {
            commonServiceAPI.get(route)
                .then(response => processResponse(response, query, type, route, dispatch))
                .catch(err => {
                    isFetchError = true
                });
        }

        if (isFetchError) {
            log.info(`[ACTION]: unable to fetch response for API = ${route}`)
            dispatch({type: type, payload: {isLoading: false, statusCode: INTERNAL_SERVER_ERROR_CODE}});
        }
    }
}

export const processResponse = (response, query, type, uri, dispatch) => {
    log.debug(`[ACTION]: Data = ${JSON.parse(JSON.stringify(response.data))}.`)
    if (response.data !== null) {
        let payload = {isLoading: false, data: JSON.parse(JSON.stringify(response.data))}
        if (query) {
            dispatch({
                type: type, payload:
                    {...payload, query: query}
            });
        } else {
            dispatch({
                type: type, payload: payload
            });
        }

        if (LOAD_FILTER_PRODUCTS.localeCompare(type) === 0 &&
            window.location.search.localeCompare(uri.split("/products")[1]) !== 0) {
            history.push(uri)
        }
    } else {
        dispatch({type: type, payload: {isLoading: false, statusCode: BAD_REQUEST_ERROR_CODE}});
    }
}

export const loadFilterAttributes = filterQuery => dispatch => {
    log.info(`[ACTION]: loadFilterAttributes Calling Filter API filterQuery = ${filterQuery}`)

    if (filterQuery) {
        let uri = `/filter${filterQuery}`
        commonServiceAPI.get(uri)
            .then(response => {
                dispatch({
                    type: LOAD_FILTER_ATTRIBUTES,
                    payload: JSON.parse(JSON.stringify(
                        {
                            ...response.data,
                            "query": filterQuery.slice(3)
                        }))
                });

                return JSON.parse(JSON.stringify(response.data))
            })
            .catch(error => {
                log.info(`[ACTION]: unable to fetch response for Filter API`)
            });
    }
};

export const getSearchSuggestions = (prefix) => async dispatch => {
    log.info(`[ACTION]: getSearchSuggestions Calling API.`)

    if (prefix) {
        let responseError = false
        const uri = SEARCH_SUGGESTION_API + prefix
        const response = await searchSuggestionServiceAPI.get(uri)
            .catch(err => {
                log.info(`[ACTION]: unable to fetch response for API = ${uri}`)
                dispatch({type: SEARCH_KEYWORD_ERROR});
                responseError = true
            });

        if (responseError) {
            return
        }

        log.debug(`[ACTION]: Data = ${JSON.parse(JSON.stringify(response.data))}.`)
        dispatch({
            type: SEARCH_KEYWORD, payload: {data: JSON.parse(JSON.stringify(response.data))}
        });
    }

}

export const setDefaultSearchSuggestions = () => dispatch => {
    log.info(`[ACTION]: getSearchSuggestions Calling API.`)

    searchSuggestionServiceAPI.get(DEFAULT_SEARCH_SUGGESTION_API)
        .then(response => {
            dispatch({
                type: SEARCH_KEYWORD, payload: {data: JSON.parse(JSON.stringify(response.data))}
            });
        })
        .catch(err => {
            log.info(`[ACTION]: unable to fetch response for API = ${DEFAULT_SEARCH_SUGGESTION_API}`)
            dispatch({type: SEARCH_KEYWORD_ERROR});
        });
}
