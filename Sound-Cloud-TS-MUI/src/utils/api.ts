import queryString from 'query-string';
import slugify from "slugify";
import { isBuildTime } from '@/lib/build-utils';

export const sendRequest = async <T>(props: IRequest) => {
    let {
        url,
        method,
        body,
        queryParams = {},
        useCredentials = false,
        headers = {},
        nextOption = {}
    } = props;

    // During build time, use mock fetch instead of real API calls
    if (isBuildTime) {
        const { mockSendRequest } = await import('@/lib/api-mock-simple');
        return mockSendRequest(props);
    }

    const options: any = {
        method: method,
        // by default setting the content-type to be json type
        headers: new Headers({ 'content-type': 'application/json', ...headers }),
        body: body ? JSON.stringify(body) : null,
        ...nextOption
    };
    if (useCredentials) options.credentials = "include";

    if (queryParams) {
        url = `${url}?${queryString.stringify(queryParams)}`;
    }

    return fetch(url, options).then(res => {
        if (res.ok) {
            return res.json() as T;
        } else {
            return res.json().then(function (json) {
                // to be able to access the error status when you catch the error 
                return {
                    statusCode: res.status,
                    message: json?.message ?? "",
                    error: json?.error ?? ""
                } as T;
            });
        }
    });
};
export const convertSlugUrl = (slug: string) => {
    if(!slug){
        return "";
    }
    slug = slugify(slug, {
        lower:true,
        locale:'vi',
    })
    return slug;
}

