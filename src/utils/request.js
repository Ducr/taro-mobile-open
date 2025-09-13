import Taro from "@tarojs/taro";

const loginPageUrl = "/pages/login/index";
// 默认配置
const defaultConfig = {
  baseURL: process.env.TARO_APP_BASE_URL,
  timeout: 2 * 60 * 1000,
  showLoading: true,
  loadingText: "加载中...",
  showError: true,
  needAuth: true,
  header: {
    "Content-Type": "application/json",
  },
};

// 自定义错误类
class RequestAbortedError extends Error {
  constructor(message = "请求已被取消") {
    super(message);
    this.name = "RequestAbortedError";
    this.isAborted = true;
  }
}

class RequestError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = "RequestError";
    this.code = code;
    this.statusCode = statusCode;
    this.isAborted = false;
  }
}

// 平台检测
const isH5 = process.env.TARO_ENV === "h5";
const isWeapp = process.env.TARO_ENV === "weapp";

// 请求类封装
class Request {
  constructor(config = {}) {
    // 合并配置
    this.defaults = { ...defaultConfig, ...config };

    // 拦截器数组
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };

    // 请求任务Map，用于中断请求
    this.requestTasks = new Map();

    // 请求ID计数器
    this.requestIdCounter = 0;

    // 设置默认拦截器
    this.setupInterceptors();
  }

  // 设置默认拦截器
  setupInterceptors() {
    // 请求拦截器 - 添加token
    this.interceptors.request.push({
      fulfilled: (config) => {
        if (config.needAuth) {
          try {
            const token = Taro.getStorageSync("token");
            if (token) {
              config.header = {
                ...config.header,
                Authorization: `Bearer ${token}`,
              };
            }
          } catch (error) {
            console.warn("获取token失败:", error);
          }
        }
        return config;
      },
    });

    // 响应拦截器 - 处理通用响应格式
    this.interceptors.response.push({
      fulfilled: (response, config) => {
        const { statusCode, data } = response;

        if (statusCode === 200) {
          // 根据后端返回结构调整
          if (data.code === 0 || data.code === 200) {
            return data.data || data;
          } else {
            // 业务错误
            throw new RequestError(
              data.message || "业务错误",
              data.code,
              statusCode,
            );
          }
        } else {
          // HTTP错误
          throw new RequestError(
            `HTTP错误: ${statusCode}`,
            "HTTP_ERROR",
            statusCode,
          );
        }
      },
    });

    // 错误拦截器 - 统一错误处理
    this.interceptors.error.push({
      fulfilled: (error, config) => {
        // 如果是中断错误，不显示提示
        if (error.isAborted) {
          console.log("请求已被取消");
          throw error;
        }

        console.error("请求错误:", error);

        if (config.showError && !error.isAborted) {
          Taro.showToast({
            title: config.customError || error.message || "请求失败",
            icon: "none",
            duration: 2000,
          });
        }

        // 身份认证失败
        if (error.statusCode === 401) {
          Taro.removeStorageSync("token");
          Taro.navigateTo({ url: loginPageUrl });
        }

        throw error;
      },
    });
  }

  // 添加请求拦截器
  addRequestInterceptor(fulfilled, rejected) {
    this.interceptors.request.push({ fulfilled, rejected });
    return this;
  }

  // 添加响应拦截器
  addResponseInterceptor(fulfilled, rejected) {
    this.interceptors.response.push({ fulfilled, rejected });
    return this;
  }

  // 添加错误拦截器
  addErrorInterceptor(fulfilled, rejected) {
    this.interceptors.error.push({ fulfilled, rejected });
    return this;
  }

  // 设置基础配置
  setConfig(config) {
    this.defaults = { ...this.defaults, ...config };
    return this;
  }

  // 设置基础URL
  setBaseURL(baseURL) {
    this.defaults.baseURL = baseURL;
    return this;
  }

  // 设置超时时间
  setTimeout(timeout) {
    this.defaults.timeout = timeout;
    return this;
  }

  // 设置认证token
  setToken(token) {
    try {
      Taro.setStorageSync("token", token);
    } catch (error) {
      console.warn("存储token失败:", error);
    }
    return this;
  }

  // 移除认证token
  removeToken() {
    try {
      Taro.removeStorageSync("token");
    } catch (error) {
      console.warn("移除token失败:", error);
    }
    return this;
  }

  // 生成简单的请求ID
  generateRequestId() {
    return `req_${this.requestIdCounter++}`;
  }

  // 中断指定请求
  abortRequest(requestId) {
    const taskInfo = this.requestTasks.get(requestId);
    if (taskInfo) {
      try {
        console.log("正在中断请求:", requestId);

        // 平台兼容处理
        if (isH5 && taskInfo.controller) {
          // H5端使用AbortController
          taskInfo.controller.abort();
        } else if (
          taskInfo.requestTask &&
          typeof taskInfo.requestTask.abort === "function"
        ) {
          // 小程序端使用requestTask.abort()
          taskInfo.requestTask.abort();
        }

        this.requestTasks.delete(requestId);
        console.log("请求已成功中断:", requestId);
        return true;
      } catch (error) {
        console.warn("中断请求失败:", error);
        return false;
      }
    } else {
      console.warn("未找到对应的请求任务:", requestId);
      return false;
    }
  }

  // 中断所有请求
  abortAllRequests() {
    let count = 0;
    const requestIds = Array.from(this.requestTasks.keys());

    requestIds.forEach((requestId) => {
      if (this.abortRequest(requestId)) {
        count++;
      }
    });

    console.log(`已中断 ${count} 个请求`);
    return count;
  }

  // 获取当前所有请求任务
  getRequestTasks() {
    return Array.from(this.requestTasks.keys());
  }

  // 核心请求方法（支持多种调用方式）
  request(url, config, requestId = null) {
    // 处理不同的调用方式
    let finalConfig = {};

    if (typeof url === "string") {
      finalConfig = { ...config, url };
    } else {
      finalConfig = { ...url };
    }

    // 合并配置
    const mergedConfig = {
      ...this.defaults,
      ...finalConfig,
      header: {
        ...this.defaults.header,
        ...finalConfig.header,
      },
    };

    // 处理 params 参数
    if (mergedConfig.params && !mergedConfig.data) {
      mergedConfig.data = mergedConfig.params;
      delete mergedConfig.params;
    }

    // 如果没有传入requestId，则生成一个新的
    const actualRequestId = requestId || this.generateRequestId();

    const requestPromise = this._request(mergedConfig, actualRequestId);

    // 关键修复：在返回的promise上添加catch捕获
    const safePromise = requestPromise.catch((error) => {
      // 如果是中断错误，静默处理，不抛出到全局
      if (
        error.isAborted ||
        (isH5 && error.name === "AbortError") ||
        (error.errMsg && error.errMsg.includes("abort"))
      ) {
        console.log("请求已被取消（静默处理）");
        // 返回一个永远不会resolve或reject的Promise，避免后续的catch触发
        // return new Promise(() => {})
        return Promise.reject(error); // 默认返回reject，触发后续的catch触发
      }
      // 其他错误正常抛出
      throw error;
    });

    return {
      promise: safePromise,
      abort: () => this.abortRequest(actualRequestId),
      requestId: actualRequestId,
    };
  }

  // 内部请求方法 - 使用Promise风格重构
  async _request(config, requestId) {
    let loadingTask = null;
    let controller = null;

    // 只在H5端使用AbortController，小程序端完全不用
    if (isH5 && typeof AbortController !== "undefined") {
      controller = new AbortController();
    }

    // 立即存储任务信息
    this.requestTasks.set(requestId, {
      requestTask: null,
      controller,
      config: config,
      loadingTask: null,
      requestId,
    });

    const cleanup = () => {
      if (loadingTask) {
        Taro.hideLoading();
      }
      if (this.requestTasks.has(requestId)) {
        this.requestTasks.delete(requestId);
      }
    };

    try {
      // 执行请求拦截器
      let processedConfig = { ...config };
      for (const interceptor of this.interceptors.request) {
        if (interceptor.fulfilled) {
          processedConfig = interceptor.fulfilled(processedConfig);
        }
      }

      // 只在H5端且支持AbortController时添加signal配置
      if (isH5 && controller) {
        processedConfig.signal = controller.signal;
      }

      // 显示加载提示
      if (processedConfig.showLoading) {
        loadingTask = Taro.showLoading({
          title: processedConfig.loadingText,
          mask: true,
        });
        // 更新存储的loadingTask
        const taskInfo = this.requestTasks.get(requestId);
        if (taskInfo) {
          taskInfo.loadingTask = loadingTask;
        }
      }

      // 构建完整URL
      let fullUrl = processedConfig.url;
      if (processedConfig.baseURL && !fullUrl.startsWith("http")) {
        fullUrl = processedConfig.baseURL + fullUrl;
      }

      // 使用Promise风格调用Taro.request
      const requestTask = Taro.request({
        ...processedConfig,
        url: fullUrl,
      });

      // 更新存储的requestTask
      const taskInfo = this.requestTasks.get(requestId);
      if (taskInfo) {
        taskInfo.requestTask = requestTask;
      }

      // 等待请求完成
      const response = await requestTask;

      // 执行响应拦截器
      let result = response;
      for (const interceptor of this.interceptors.response) {
        if (interceptor.fulfilled) {
          result = interceptor.fulfilled(result, processedConfig);
        }
      }

      cleanup();
      return result;
    } catch (error) {
      cleanup();

      // H5端：如果是AbortController中断的请求，使用自定义错误
      if (isH5 && error.name === "AbortError" && controller) {
        throw new RequestAbortedError("请求已被取消");
      }

      // 小程序端：中断错误处理
      if (
        isWeapp && error.errMsg && error.errMsg.includes("request:fail abort")
      ) {
        throw new RequestAbortedError("请求已被取消");
      }

      // 执行错误拦截器
      let processedError = error;
      for (const interceptor of this.interceptors.error) {
        if (interceptor.fulfilled) {
          try {
            processedError = interceptor.fulfilled(processedError, config);
          } catch (interceptorError) {
            processedError = interceptorError;
          }
        }
      }

      throw processedError;
    }
  }

  // 快捷方法 - GET
  get(url, params, config = {}) {
    const requestConfig = { url, params, method: "GET", ...config };
    const requestId = this.generateRequestId();
    return this.request(requestConfig, requestId);
  }

  // 快捷方法 - POST
  post(url, data, config = {}) {
    const requestConfig = { url, data, method: "POST", ...config };
    const requestId = this.generateRequestId();
    return this.request(requestConfig, requestId);
  }

  // 快捷方法 - PUT
  put(url, data, config = {}) {
    const requestConfig = { url, data, method: "PUT", ...config };
    const requestId = this.generateRequestId();
    return this.request(requestConfig, requestId);
  }

  // 快捷方法 - DELETE
  delete(url, data, config = {}) {
    const requestConfig = { url, data, method: "DELETE", ...config };
    const requestId = this.generateRequestId();
    return this.request(requestConfig, requestId);
  }

  // 上传文件
  upload(url, filePath, formData = {}, config = {}) {
    const requestId = this.generateRequestId();

    const uploadPromise = new Promise(async (resolve, reject) => {
      let uploadTask = null;

      // 存储任务信息
      this.requestTasks.set(requestId, {
        requestTask: null,
        config: { url, filePath, formData, method: "UPLOAD", ...config },
        loadingTask: null,
        requestId,
      });

      const cleanup = () => {
        if (this.requestTasks.has(requestId)) {
          this.requestTasks.delete(requestId);
        }
      };

      try {
        // 构建完整URL
        let fullUrl = url;
        if (this.defaults.baseURL && !url.startsWith("http")) {
          fullUrl = this.defaults.baseURL + url;
        }

        // 使用Promise风格调用Taro.uploadFile
        uploadTask = Taro.uploadFile({
          url: fullUrl,
          filePath,
          name: config.name || "file",
          formData,
          header: {
            ...this.defaults.header,
            ...config.header,
          },
        });

        // 更新存储的requestTask
        const taskInfo = this.requestTasks.get(requestId);
        if (taskInfo) {
          taskInfo.requestTask = uploadTask;
        }

        // 上传进度监听
        if (config.onProgressUpdate) {
          uploadTask.onProgressUpdate(config.onProgressUpdate);
        }

        // 等待上传完成
        const res = await uploadTask;

        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            cleanup();
            resolve(data);
          } catch (e) {
            cleanup();
            resolve(res.data);
          }
        } else {
          cleanup();
          reject(
            new RequestError(
              `上传失败: ${res.statusCode}`,
              "UPLOAD_ERROR",
              res.statusCode,
            ),
          );
        }
      } catch (error) {
        cleanup();

        if (error.errMsg && error.errMsg.includes("uploadFile:fail abort")) {
          reject(new RequestAbortedError("上传已被取消"));
        } else {
          reject(
            new RequestError(
              error.message || "上传失败",
              "UPLOAD_ERROR",
              error.statusCode,
            ),
          );
        }
      }
    });

    // 添加上传请求的catch捕获
    const safeUploadPromise = uploadPromise.catch((error) => {
      if (
        error.isAborted ||
        (error.errMsg && error.errMsg.includes("abort"))
      ) {
        console.log("上传已被取消（静默处理）");
        return new Promise(() => {});
      }
      throw error;
    });

    return {
      promise: safeUploadPromise,
      abort: () => this.abortRequest(requestId),
      requestId,
    };
  }
}

// 创建默认实例
const requestInstance = new Request();

// 挂载到Taro全局
if (!Taro.$request) {
  // 核心请求方法
  const requestFunction = function (url, config) {
    // 处理不同的调用方式
    let finalConfig = {};

    if (typeof url === "string") {
      finalConfig = { ...config, url };
    } else {
      finalConfig = { ...url };
    }

    return requestInstance.request(finalConfig);
  };

  // 挂载主函数和快捷方法
  Taro.$request = requestFunction;
  Taro.$request.get = requestInstance.get.bind(requestInstance);
  Taro.$request.post = requestInstance.post.bind(requestInstance);
  Taro.$request.put = requestInstance.put.bind(requestInstance);
  Taro.$request.delete = requestInstance.delete.bind(requestInstance);
  Taro.$request.upload = requestInstance.upload.bind(requestInstance);

  // 挂载配置方法
  Taro.$request.setConfig = requestInstance.setConfig.bind(requestInstance);
  Taro.$request.setBaseURL = requestInstance.setBaseURL.bind(requestInstance);
  Taro.$request.setTimeout = requestInstance.setTimeout.bind(requestInstance);
  Taro.$request.setToken = requestInstance.setToken.bind(requestInstance);
  Taro.$request.removeToken = requestInstance.removeToken.bind(requestInstance);

  // 挂载中断相关方法
  Taro.$request.abort = requestInstance.abortRequest.bind(requestInstance);
  Taro.$request.abortAll = requestInstance.abortAllRequests.bind(
    requestInstance,
  );
  Taro.$request.getRequests = requestInstance.getRequestTasks.bind(
    requestInstance,
  );

  // 挂载拦截器方法
  Taro.$request.addRequestInterceptor = requestInstance.addRequestInterceptor
    .bind(requestInstance);
  Taro.$request.addResponseInterceptor = requestInstance.addResponseInterceptor
    .bind(requestInstance);
  Taro.$request.addErrorInterceptor = requestInstance.addErrorInterceptor.bind(
    requestInstance,
  );
}

// 创建别名
if (!Taro.$http) {
  Taro.$http = Taro.$request;
}

// 导出
export default requestInstance;
export { Request, RequestAbortedError, RequestError };
