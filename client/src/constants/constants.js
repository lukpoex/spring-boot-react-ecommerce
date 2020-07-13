
export const MAX_PRODUCTS_PER_PAGE = 16;

export const TAB_CONFIG = [
    {index: 0, label: 'MEN', color: '#ee5f73', mapKey: "men"},
    {index: 1, label: 'WOMEN', color: '#fb56c1', mapKey: "women"},
    {index: 2, label: 'KIDS', color: '#f26a10', mapKey: "boys"},
    {index: 3, label: 'ESSENTIALS', color: '#0db7af', mapKey: "essentials"},
    {index: 4, label: 'HOME & LIVING', color: '#f2c210', mapKey: "homeAndLiving"},
];

export const INITIAL_PAGINATION_STATE = {
    pageNumber: 1,
    maxProducts: MAX_PRODUCTS_PER_PAGE
}

export const INITIAL_SORT_STATE = {
    id: 1,
    value: null
}

export const INITIAL_FILTER_ATTRIBUTE_STATE = {
    genders: [],
    apparels: [],
    brands: [],
    prices: []
}

export const FILTER_ATTRIBUTES = ["genders", "apparels", "brands", "prices"]

export const HOME_ROUTE = '/'
export const PRODUCTS_ROUTE = '/products'
export const DETAILS_ROUTE = '/products/details'
