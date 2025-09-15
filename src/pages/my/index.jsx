import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Avatar, Button, Cell } from "@taroify/core";
import "./index.scss";
import CTabBar from "../../components/CTabBar";

export default function My() {
  useLoad(() => {});

  const userInfo = Taro.getStorageSync("userInfo")
  const [isLogin, setIsLogin] = useState(() => !!userInfo.token);
  const goToLogin = () => {
    Taro.reLaunch({
      url: "/pages/login/index",
    });
  };
  const doLogout = () => {
    setIsLogin(false);
    Taro.clearStorageSync("userInfo");
    Taro.clearStorageSync("token");
  };
  const onChangeTabItem = (value) => {
    if (value === 0) {
      Taro.navigateTo({
        url: "/pages/project/index",
      });
    }
  };

  return (
    <View className="my-page">
      <Avatar src="https://joesch.moe/api/v1/random" size="large" />
      {isLogin
        ? (
          <View className="userinfo-container">
            <Cell bordered={false}>{userInfo.username}</Cell>
            <View className="btn-wrapper">
              <Button color="primary" size="small" onClick={doLogout}>
                退出登录
              </Button>
            </View>
          </View>
        )
        : (
          <Button
            color="primary"
            size="small"
            style={{ marginTop: "46px" }}
            onClick={goToLogin}
          >
            前往登录
          </Button>
        )}

      <CTabBar value={1} onChange={onChangeTabItem} />
    </View>
  );
}
