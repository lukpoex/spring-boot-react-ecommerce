package com.ujjaval.ecommerce.commondataservice.dao.sql.info.impl;

import com.ujjaval.ecommerce.commondataservice.dao.sql.info.queryhelpers.ProductQueryHelper;
import com.ujjaval.ecommerce.commondataservice.dao.sql.info.queryhelpers.context.ParamsToQueryContext;
import com.ujjaval.ecommerce.commondataservice.dto.*;
import com.ujjaval.ecommerce.commondataservice.entity.sql.info.ProductInfo;
import com.ujjaval.ecommerce.commondataservice.model.FilterAttributesResponse;
import com.ujjaval.ecommerce.commondataservice.model.HomeTabsDataResponse;
import com.ujjaval.ecommerce.commondataservice.utils.resulttransformers.ListResultTransformer;
import org.javatuples.Pair;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.*;
import java.util.stream.Collectors;

public class ProductInfoRepositoryImpl {

    @PersistenceContext
    private EntityManager entityManager;

    public Pair<Long, List<ProductInfo>> getProductsByCategories(HashMap<String, String> conditionMap) {
        ParamsToQueryContext paramsToQueryContext = new ProductQueryHelper().getParamsToQueryMap(conditionMap);

        String sortBy = paramsToQueryContext.getSortBy();
        HashMap<Integer, Object> mapParams = paramsToQueryContext.getMapParams();
        List<String> conditions = paramsToQueryContext.getConditions();
        String[] pageInfo = paramsToQueryContext.getPageInfo();

        TypedQuery<Long> totalCountQuery = (TypedQuery<Long>) entityManager.createQuery(
                "select count(*) from ProductInfo p where "
                        + String.join(" AND ", conditions));

        mapParams.forEach(totalCountQuery::setParameter);

        List<Long> totalCountQueryResultList = totalCountQuery.getResultList();

        if (totalCountQueryResultList != null && totalCountQueryResultList.get(0) > 0) {
            Long totalCount = totalCountQueryResultList.get(0);

            TypedQuery<ProductInfo> query = entityManager.createQuery(
                    "select p from ProductInfo p where "
                            + String.join(" AND ", conditions) + sortBy, ProductInfo.class);

            mapParams.forEach(query::setParameter);

            if (pageInfo != null && pageInfo.length == 2) {
                return new Pair<>(totalCount, query.setFirstResult(Integer.parseInt(pageInfo[0]))
                        .setMaxResults(Integer.parseInt(pageInfo[1]))
                        .getResultList());
            }

            return new Pair<>(totalCount, query.getResultList());
        }
        return null;
    }

    public List<ProductInfo> getProductsById(String[] product_ids_str) {
        List<Integer> productIds = new ArrayList<>();

        for (String id : product_ids_str) {
            productIds.add(Integer.valueOf(id));
        }

        TypedQuery<ProductInfo> query = entityManager.createQuery(
                "SELECT p FROM ProductInfo p WHERE p.id IN (?1)", ProductInfo.class);
        query.setParameter(1, productIds);

        return query.getResultList();
    }

    private ParamsToQueryContext filterAndGetConditionMap(ProductQueryHelper productQueryHelper,
                                                          HashMap<String, String> conditionMap,
                                                          String queryParam) {
        Map<String, String> filterConditionMap = null;

        if (conditionMap.containsKey(queryParam)) {
            filterConditionMap = conditionMap.entrySet()
                    .stream()
                    .filter(map -> !map.getKey().equals(queryParam))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

            if (!filterConditionMap.containsKey("brands") && !filterConditionMap.containsKey("genders")
                    && !filterConditionMap.containsKey("apparels") && !filterConditionMap.containsKey("prices")) {
                filterConditionMap.put("category", "all");
            }
        }

        ParamsToQueryContext paramsToQueryContext;
        if (filterConditionMap != null) {
            paramsToQueryContext =
                    productQueryHelper.getParamsToQueryMap((HashMap<String, String>) filterConditionMap);
        } else {
            paramsToQueryContext = productQueryHelper.getParamsToQueryMap(conditionMap);
        }

        return paramsToQueryContext;
    }

    public FilterAttributesResponse getFilterAttributesByProducts(HashMap<String, String> conditionMap) {
        ProductQueryHelper productQueryHelper = new ProductQueryHelper();
        ListResultTransformer listResultTransformer = new ListResultTransformer();

        ParamsToQueryContext paramsToQueryContext = filterAndGetConditionMap(productQueryHelper,
                conditionMap, "brands");

        List<FilterAttributesWithTotalItemsDTO>
                brandList = listResultTransformer.getFilterAttributesWithTotalItemsResultTransformer(
                "SELECT p.productBrandCategory.id, p.productBrandCategory.type, count(*) as totalItems " +
                        "from ProductInfo p where " +
                        String.join(" AND ", paramsToQueryContext.getConditions()) +
                        "group by p.productBrandCategory.id, p.productBrandCategory.type order by totalItems desc",
                paramsToQueryContext.getMapParams(), entityManager);

        paramsToQueryContext = filterAndGetConditionMap(productQueryHelper, conditionMap, "genders");
        List<FilterAttributesWithTotalItemsDTO>
                genderList = listResultTransformer.getFilterAttributesWithTotalItemsResultTransformer(
                "SELECT p.genderCategory.id, p.genderCategory.type, count(*) as totalItems " +
                        "from ProductInfo p where " + String.join(" AND ", paramsToQueryContext.getConditions()) +
                        "group by p.genderCategory.id, p.genderCategory.type order by totalItems desc",
                paramsToQueryContext.getMapParams(), entityManager);

        paramsToQueryContext = filterAndGetConditionMap(productQueryHelper, conditionMap, "apparels");
        List<FilterAttributesWithTotalItemsDTO>
                apparelList = listResultTransformer.getFilterAttributesWithTotalItemsResultTransformer(
                "SELECT p.apparelCategory.id, p.apparelCategory.type, count(*) as totalItems " +
                        "from ProductInfo p where " + String.join(" AND ", paramsToQueryContext.getConditions()) +
                        "group by p.apparelCategory.id, p.apparelCategory.type order by totalItems desc",
                paramsToQueryContext.getMapParams(), entityManager);

        paramsToQueryContext = filterAndGetConditionMap(productQueryHelper, conditionMap, "prices");
        List<FilterAttributesWithTotalItemsDTO>
                priceList = listResultTransformer.getFilterAttributesWithTotalItemsResultTransformer(
                "SELECT p.priceRangeCategory.id, p.priceRangeCategory.type, count(*) as totalItems " +
                        "from ProductInfo p where " + String.join(" AND ", paramsToQueryContext.getConditions()) +
                        "group by p.priceRangeCategory.id, p.priceRangeCategory.type order by p.priceRangeCategory.id",
                paramsToQueryContext.getMapParams(), entityManager);

        FilterAttributesResponse filterAttributesResponse = new FilterAttributesResponse();
        filterAttributesResponse.setBrands(brandList);
        filterAttributesResponse.setGenders(genderList);
        filterAttributesResponse.setApparels(apparelList);
        filterAttributesResponse.setPrices(priceList);

        return filterAttributesResponse;
    }

    private BrandsAndApparelsDTO getBrandsAndApparelsList(int gender_id) {
        BrandsAndApparelsDTO brandsAndApparelsDTO = new BrandsAndApparelsDTO();
        HashMap<Integer, Object> mapParams = new HashMap<>(Map.of(1, gender_id));
        ListResultTransformer listResultTransformer = new ListResultTransformer();

        brandsAndApparelsDTO.setBrands(listResultTransformer.getFilterAttributesResultTransformer(
                "SELECT DISTINCT p.productBrandCategory.id, p.productBrandCategory.type " +
                        "from ProductInfo p where p.genderCategory.id=?1" +
                        " group by p.productBrandCategory.id, p.productBrandCategory.type" +
                        " order by count(*) desc", mapParams, entityManager));

        brandsAndApparelsDTO.setApparels(listResultTransformer.getFilterAttributesResultTransformer(
                "SELECT DISTINCT p.apparelCategory.id, p.apparelCategory.type " +
                        "from ProductInfo p where p.genderCategory.id=?1 " +
                        "group by p.apparelCategory.id, p.apparelCategory.type " +
                        "order by count(*) desc", mapParams, entityManager));

        return brandsAndApparelsDTO;
    }

    public HomeTabsDataResponse getBrandsAndApparelsByGender() {
        HomeTabsDataResponse homeTabsDataResponse = new HomeTabsDataResponse();

        homeTabsDataResponse.setWomen(getBrandsAndApparelsList(1));
        homeTabsDataResponse.setMen(getBrandsAndApparelsList(2));
        homeTabsDataResponse.setGirls(getBrandsAndApparelsList(3));
        homeTabsDataResponse.setBoys(getBrandsAndApparelsList(4));
        homeTabsDataResponse.setHomeAndLiving(getBrandsAndApparelsList(5));
        homeTabsDataResponse.setEssentials(getBrandsAndApparelsList(6));
        return homeTabsDataResponse;
    }

    public List<SearchSuggestionForThreeAttrDTO> getGenderApparelBrandByIdAndName() {
        ListResultTransformer listResultTransformer = new ListResultTransformer();

        return listResultTransformer.getSearchSuggestionForThreeAttrResultTransformer("SELECT DISTINCT " +
                        " p.genderCategory.id, p.genderCategory.type," +
                        " p.apparelCategory.id, p.apparelCategory.type," +
                        " p.productBrandCategory.id, p.productBrandCategory.type from ProductInfo p"
                , entityManager);
    }

    public List<SearchSuggestionForTwoAttrDTO> getGenderAndApparelByIdAndName() {
        ListResultTransformer listResultTransformer = new ListResultTransformer();
        return listResultTransformer.getSearchSuggestionForTwoAttrResultTransformer("SELECT DISTINCT " +
                        " p.genderCategory.id, p.genderCategory.type," +
                        " p.apparelCategory.id, p.apparelCategory.type" +
                        " from ProductInfo p"
                , entityManager);
    }

    public List<SearchSuggestionForTwoAttrDTO> getGenderAndBrandByIdAndName() {
        ListResultTransformer listResultTransformer = new ListResultTransformer();
        return listResultTransformer.getSearchSuggestionForTwoAttrResultTransformer("SELECT DISTINCT " +
                        " p.genderCategory.id, p.genderCategory.type," +
                        " p.productBrandCategory.id, p.productBrandCategory.type" +
                        " from ProductInfo p"
                , entityManager);
    }

    public List<SearchSuggestionForTwoAttrDTO> getApparelAndBrandByIdAndName() {
        ListResultTransformer listResultTransformer = new ListResultTransformer();
        return listResultTransformer.getSearchSuggestionForTwoAttrResultTransformer("SELECT DISTINCT " +
                        " p.apparelCategory.id, p.apparelCategory.type," +
                        " p.productBrandCategory.id, p.productBrandCategory.type" +
                        " from ProductInfo p"
                , entityManager);
    }
}