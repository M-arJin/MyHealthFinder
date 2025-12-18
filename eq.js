const _prompt = require("prompt-sync")()
const _nodefetch = require('node-fetch')
const { HttpsProxyAgent } = require('https-proxy-agent');

let _isAtSchool = _prompt("Are you at school (Y/n)? ")
if (_isAtSchool.toUpperCase().trim().startsWith("Y") || _isAtSchool.trim().length === 0) {
    const _password = _prompt.hide("EQ Password? ")
    const _proxyUrl = `http://cboyd60:${_password}@proxy2.eq.edu.au:80`;
    const _proxyAgent = new HttpsProxyAgent(_proxyUrl);
    //overwrite the default fetch with the one that can use the school proxy
    //and load it up with the entered proxy data
    fetch = async function (url) {
        // Fetch the target website using the proxy agent
        const _response = await _nodefetch(url, { agent: _proxyAgent });
        return _response
    }
}