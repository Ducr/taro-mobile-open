import Taro, { useLoad } from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import "./index.scss";

export default function Login() {
  useLoad(() => {});

  return (
    <View className="login-page">
      <Text>登录页!</Text>
    </View>
  );
}
