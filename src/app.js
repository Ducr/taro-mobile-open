import Taro, { useLaunch } from "@tarojs/taro";
// 使用Style 内置样式
import "@taroify/core/styles/index.css";
// import "./utils/request.js"; // 使用封装后的request
import "./app.scss";

// 拓展Taro.$request简单处理token和url
Taro.$request = ((request) => {
  return (config) => {
    const token = Taro.getStorageSync("token");
    if (token) {
      if (!config.header) config.header = {};
      config.header.Authorization = `Bearer ${token}`;
    }
    if (!config.url.startsWith("http")) {
      config.url = process.env.TARO_APP_BASE_URL + config.url;
    }
    return request(config);
  };
})(Taro.request);

function App({ children }) {
  useLaunch(() => {
    console.log("App launched.");
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
