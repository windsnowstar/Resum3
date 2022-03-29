'use strict';

const APIURL = 'https://api-mumbai.lens.dev/';

const Controller = require('egg').Controller;
const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');

const gql = require('graphql-tag');
const ApolloClient = require('apollo-boost').ApolloClient;
const fetch = require('cross-fetch/polyfill').fetch;
const ApolloLink = require('apollo-link').ApolloLink;
const createHttpLink = require('apollo-link-http').createHttpLink;
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;

let clientId = "";
let clientSecret ="";
let inited = false;

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    headers: {
      'x-access-token':' '
    }
  });
  return forward(operation);
});

const apolloClient = new ApolloClient({
  link: authLink.concat(createHttpLink({
        uri: APIURL,
        fetch: fetch
    })),
  cache: new InMemoryCache(),
})

class ResumeController extends Controller {
  async index() {
    //console.log(apolloClient);
    console.log("env", this.app.env);
    if(!inited){
      console.log("env", this.app.env);
      let resumeConfig = fs.readFileSync(this.app.config.configPath);
      let res = resumeConfig.toString();
      let resumeConfigJson = JSON.parse(res);
      clientId = resumeConfigJson.clientId;
      clientSecret = resumeConfigJson.clientSecret;
      inited = true;
      console.log("init resume config", res);
    }

    const { ctx } = this;
    await this.ctx.render('index.html', {});
  }

  //github/login
  async githubLogin() {
    const { ctx } = this;
    let url = `https://github.com/login/oauth/authorize?client_id=${clientId}`;
    ctx.redirect(url);
    console.log('authorize url', url);
  }

  //github/callback
  async githubCallback() {

    const { ctx } = this;
    const code = ctx.query.code;
    console.log('/github/callback,code:', code);
    let res = await axios.post('https://github.com/login/oauth/access_token',{
        client_id:clientId,
        client_secret:clientSecret,
        code:code
    });
    let access_token = querystring.parse(res.data).access_token;
    console.log('https://github.com/login/oauth/access_token is ', access_token);

    let tokenHeader = `token ${access_token}`;
    let userInfo = await axios.get(`https://api.github.com/user`,{
      headers:{
        Authorization : tokenHeader
      }
    });
    console.log('https://api.github.com/user userInfo is', userInfo.data);
    let {login, avatar_url, bio, html_url,following} = userInfo.data;

    await this.ctx.render('callbackSuccess.html', userInfo.data);
  }

  async generateChallenge(){
    const { ctx } = this;
    const address = ctx.query.address;
     const GET_CHALLENGE = `
      query($request: ChallengeRequest!) {
        challenge(request: $request) { text }
      }
    `;

    const generateChallenge = await apolloClient.query({
    query: gql(GET_CHALLENGE),
    variables: {
        request: {
           address: address
        }
      }
    });

    console.log("generateChallenge" , generateChallenge);
    ctx.body = `${generateChallenge.data.challenge.text}`;
    
  }

  async authenticate(){
    const { ctx } = this;
    const address = ctx.query.address;
    const sign = ctx.query.sign;
    console.log('authenticate , address and sign: ', address, sign);

    const AUTHENTICATION = `
      mutation($request: SignedAuthChallenge!) { 
        authenticate(request: $request) {
          accessToken
          refreshToken
        }
     }`;

    const authenticate = await apolloClient.mutate({
      mutation: gql(AUTHENTICATION),
      variables: {
        request: {
          address:address,
          signature:sign
        }
      }
    })

    console.log("authenticate result:", authenticate);
    ctx.body = `${authenticate.data.authenticate.accessToken}____${authenticate.data.authenticate.refreshToken}`;
  }


  async refreshAccessToken(){
      const { ctx } = this;
      const refreshToken = ctx.query.refreshToken;
      console.log('refreshAccessToken', refreshToken);
      const REFRESH_AUTHENTICATION = `
        mutation($request: RefreshRequest!) {
          refresh(request: $request) {
            accessToken
            refreshToken
          }
       }
      `
      const result = await apolloClient.mutate({
        mutation: gql(REFRESH_AUTHENTICATION),
        variables: {
          request: {
            refreshToken:refreshToken
          }
        }
      })

      console.log("refreshAccessToken result:", result);

      ctx.body = `${result.data.refresh.accessToken}____${result.data.refresh.refreshToken}`;
  }

  async createProfile(){
    const { ctx } = this;
    const accessToken = ctx.query.accessToken;
    const profileName = ctx.query.profileName;
    const authLink = new ApolloLink((operation, forward) => {
      // Retrieve the authorization token from local storage.
      // if your using node etc you have to handle your auth different
      // Use the setContext method to set the HTTP headers.
      operation.setContext({
        headers: {
          'x-access-token':`Bearer ${accessToken}`
        }
      });

      // Call the next link in the middleware chain.
      return forward(operation);
    });



    const apolloClient = new ApolloClient({
      link: authLink.concat(createHttpLink({
            uri: APIURL,
            fetch: fetch
        })),
      cache: new InMemoryCache(),
    })

    const CREATE_PROFILE = `
      mutation($request: CreateProfileRequest!) { 
        createProfile(request: $request) {
          ... on RelayerResult {
            txHash
          }
          ... on RelayError {
            reason
          }
                __typename
        }
     }
    `;

    const createProfileResult =  await apolloClient.mutate({
        mutation: gql(CREATE_PROFILE),
        variables: {
          request: { 
                handle: `${profileName}`,
                profilePictureUri: null,
                followNFTURI: null,
                followModule: null
          }
        }
      });

    console.log('create profile: result', createProfileResult.data);
    ctx.body=`${createProfileResult.data.createProfile.txHash}`;

  }


  async updateProfile(){

    const { ctx } = this;
    const accessToken = ctx.request.body.accessToken;
    const profileId = ctx.request.body.profileId;
    const name = ctx.request.body.name;
    const bio = ctx.request.body.bio;
    const website = ctx.request.body.website;
    const twitterUrl = ctx.request.body.twitterUrl;

    console.log("updateProfile", accessToken, profileId,name, bio,website,twitterUrl );

    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          'x-access-token':`Bearer ${accessToken}`
        }
      });
      return forward(operation);
    });

    const apolloClient = new ApolloClient({
      link: authLink.concat(createHttpLink({
            uri: APIURL,
            fetch: fetch
        })),
      cache: new InMemoryCache(),
    })

    const UPDATE_PROFILE = `
      mutation($request: UpdateProfileRequest!) { 
        updateProfile(request: $request) {
         id
        }
     }
    `;

    const result =  await apolloClient.mutate({
        mutation: gql(UPDATE_PROFILE),
        variables: {
          request: { 
            profileId: profileId,
            name: name,
            bio: bio,
            location: null,
            website: website,
            twitterUrl: twitterUrl,
            coverPicture: null
          }
        }
      });

    console.log('update profile: result', result.data);
    ctx.body=`${result.data.updateProfile}`;

  }

  async followProfile(){
    const { ctx } = this;
    const accessToken = ctx.request.body.accessToken;
    const profileId = ctx.request.body.profileId;
    console.log("followProfile", accessToken, profileId);

    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          'x-access-token':`Bearer ${accessToken}`
        }
      });
      return forward(operation);
    });

    const apolloClient = new ApolloClient({
      link: authLink.concat(createHttpLink({
            uri: APIURL,
            fetch: fetch
        })),
      cache: new InMemoryCache(),
    })

    const CREATE_FOLLOW_TYPED_DATA = `
      mutation($request: FollowRequest!) { 
        createFollowTypedData(request: $request) {
          id
          expiresAt
          typedData {
            domain {
              name
              chainId
              version
              verifyingContract
            }
            types {
              FollowWithSig {
                name
                type
              }
            }
            value {
              nonce
              deadline
              profileIds
              datas
            }
          }
        }
     }
    `;

    const result =  await apolloClient.mutate({
        mutation: gql(CREATE_FOLLOW_TYPED_DATA),
        variables: {
          request: { 
            follow: [
              {
                profile: profileId,
                followModule: null
              }
            ]
          }
        }
      });

    console.log('follow profile: result', result.data);
    console.log('follow profile: result', result.data.createFollowTypedData.typedData);
    ctx.body=`${result.data.updateProfile}`;

  }

  async userProfiles() {
    const { ctx } = this;
    const address = ctx.query.address;
    console.log("address",address);
    const GET_PROFILES = `
      query($request: ProfileQueryRequest!) {
        profiles(request: $request) {
          items {
            id
            name
            bio
            location
            website
            twitterUrl
            picture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
              __typename
            }
            handle
            coverPicture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
              __typename
            }
            ownedBy
            depatcher {
              address
              canUseRelay
            }
            stats {
              totalFollowers
              totalFollowing
              totalPosts
              totalComments
              totalMirrors
              totalPublications
              totalCollects
            }
            followModule {
              ... on FeeFollowModuleSettings {
                type
                amount {
                  asset {
                    symbol
                    name
                    decimals
                    address
                  }
                  value
                }
                recipient
              }
              __typename
            }
          }
          pageInfo {
            prev
            next
            totalCount
          }
        }
      }
    `;

    let res = await apolloClient.query({
      query: gql(GET_PROFILES),
      variables: {
        request:{
          ownedBy: address
        }
      }
    });

    console.log(JSON.stringify(res.data));
    await this.ctx.render('userprofile.html', res.data);

  }

  async allProfiles() {
    const { ctx } = this;
    const GET_PROFILES = `
    query($request: ProfileQueryRequest!) {
      profiles(request: $request) {
        items {
          id
          name
          bio
          location
          website
          twitterUrl
          picture {
            ... on NftImage {
              contractAddress
              tokenId
              uri
              verified
            }
            ... on MediaSet {
              original {
                url
                mimeType
              }
            }
            __typename
          }
          handle
          coverPicture {
            ... on NftImage {
              contractAddress
              tokenId
              uri
              verified
            }
            ... on MediaSet {
              original {
                url
                mimeType
              }
            }
            __typename
          }
          ownedBy
          depatcher {
            address
            canUseRelay
          }
          stats {
            totalFollowers
            totalFollowing
            totalPosts
            totalComments
            totalMirrors
            totalPublications
            totalCollects
          }
          followModule {
            ... on FeeFollowModuleSettings {
              type
              amount {
                asset {
                  symbol
                  name
                  decimals
                  address
                }
                value
              }
              recipient
            }
            __typename
          }
        }
        pageInfo {
          prev
          next
          totalCount
        }
      }
    }`;


    let res = await apolloClient.query({
      query: gql(GET_PROFILES),
      variables: {
        request:{
          profileIds: ["0x01","0x0200","0x0100","0x02","0x03","0x0300","0x0200","0x0250","0x0330","0x0310"], 
          limit: 10
        }
      }
    });

    console.log(JSON.stringify(res.data));
    await this.ctx.render('allprofile.html', res.data);

  }

}

module.exports = ResumeController;
