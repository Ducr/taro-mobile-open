import { useRef, useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { Button as MiniProgramButton, View } from "@tarojs/components";
import { Avatar, Button, Cell, Form, Input, Tabs, Toast } from "@taroify/core";
import "./index.scss";

const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB;

export default function Login() {
  useLoad(() => {
    !isH5 && Taro.hideHomeButton();
  });

  const [actionType, setActionType] = useState(1);
  const formRef = useRef();

  const onChange = (value) => {
    setActionType(value);
  };

  const onSubmit = (event) => {
    doLoginOrRegisterH5(event.detail.value, actionType);
  };

  // 使用手机号码登录
  const getphonenumber = (event) => {
    // errMsg: "getPhoneNumber:fail no permission"
    // 个人主体的小程序无获取手机号码权限，默认使用13800138000
    doLogin("13800138000");
  };

  // 小程序点击登录
  const doLogin = async (phoneNumber) => {
    const userInfoRes = await Taro.getUserInfo();
    login(userInfoRes);

    async function login(data) {
      let {
        userInfo,
        encryptedData,
        iv,
      } = data;
      // 本地token与微信服务器上的session要分别对待
      let tokenIsValid = false, sessionIsValid = false;
      let checkRes = await Taro.checkSession().catch(() => {
        // 清理登陆状态，会触发该错误
        // checkSession:fail 系统错误，错误码：-13001,session time out…d relogin
        tokenIsValid = false;
      });

      if (checkRes && checkRes.errMsg === "checkSession:ok") {
        sessionIsValid = true;
      }
      let token = Taro.getStorageSync("token");
      if (token) tokenIsValid = true;

      if (!tokenIsValid || !sessionIsValid) {
        let loginRes = await Taro.login();
        if (loginRes.code && loginRes.errMsg === "login:ok") {
          Taro.showLoading({ title: "登录中" });
          let res = await Taro.$request({
            url: "/user/weapp-login",
            method: "POST",
            data: {
              code: loginRes.code,
              phoneNumber,
              userInfo,
              encryptedData,
              iv,
              sessionKeyIsValid: sessionIsValid,
            },
          });
          Taro.hideLoading();
          if (res.data.code !== 200) {
            Taro.showModal({
              title: "登录失败",
              content: "请退出小程序，清空记录并重试",
            });
            return;
          }
          Taro.setStorageSync("userInfo", res.data.data);
          Taro.setStorageSync("token", res.data.data.token);
        }
      }

      Taro.showToast({
        title: "登录成功",
        icon: "none",
      });
      Taro.redirectTo({
        url: "/pages/project/index",
      });
    }
  };

  // H5登录/注册
  const doLoginOrRegisterH5 = (userInfo, type) => {
    Taro.$request({
      url: "/user/login",
      method: "POST",
      data: {
        type,
        ...userInfo,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          Taro.setStorageSync("userInfo", res.data.data);
          Taro.setStorageSync("token", res.data.data.token);
          Taro.showToast({
            title: "登录成功",
            icon: "none",
          });
          Taro.redirectTo({
            url: "/pages/project/index",
          });
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      });
  };

  return (
    <View className="login-page">
      {!isH5
        ? (
          <>
            <Avatar size="large"></Avatar>
            <MiniProgramButton
              color="primary"
              type="primary"
              size="default"
              style={{ marginTop: "32px" }}
              open-type="getPhoneNumber"
              onGetPhoneNumber={getphonenumber}
            >
              使用手机号登录
            </MiniProgramButton>
          </>
        )
        : (
          <>
            <Tabs theme="card" value={actionType} onChange={onChange}>
              <Tabs.TabPane title="登录" value={1}></Tabs.TabPane>
              <Tabs.TabPane title="注册" value={0}></Tabs.TabPane>
            </Tabs>
            <Form ref={formRef} validateTrigger="onChange" onSubmit={onSubmit}>
              <Toast id="toast" />
              <Cell.Group inset>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: "请输入用户名" }]}
                >
                  <Form.Label>用户名</Form.Label>
                  <Form.Control>
                    <Input placeholder="请输入用户名" />
                  </Form.Control>
                </Form.Item>
                <Form.Item
                  name="phoneNumber"
                  rules={[{ required: true, message: "请输入手机号" }]}
                >
                  <Form.Label>手机号</Form.Label>
                  <Form.Control>
                    <Input placeholder="请输入手机号" />
                  </Form.Control>
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                >
                  <Form.Label>密&nbsp;&nbsp;&nbsp;&nbsp;码</Form.Label>
                  <Form.Control>
                    <Input placeholder="请输入密码" />
                  </Form.Control>
                </Form.Item>
              </Cell.Group>
              <View className="btn-wrapper">
                <Button shape="round" block color="primary" formType="submit">
                  提交
                </Button>
                <Button
                  shape="round"
                  block
                  color="warning"
                  formType="reset"
                >
                  重置
                </Button>
              </View>
            </Form>
          </>
        )}
    </View>
  );
}
