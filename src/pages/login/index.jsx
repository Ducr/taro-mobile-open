import { useRef } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Button, Cell, Form, Input, Navbar, Toast } from "@taroify/core";
import "./index.scss";

export default function Login() {
  useLoad(() => {});

  const formRef = useRef();
  const onSubmit = (event) => {
    console.log("🚀 ~ onSubmit ~ event.detail.value:", event.detail.value);
  };

  return (
    <View className="login-page">
      <Navbar title="登录"></Navbar>
      <Form ref={formRef} onSubmit={onSubmit} validateTrigger="onChange">
        <Toast id="toast" />
        <Cell.Group inset>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Form.Label>用户名</Form.Label>
            <Form.Control>
              <Input placeholder="用户名" />
            </Form.Control>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Form.Label>密码</Form.Label>
            <Form.Control>
              <Input placeholder="密码" />
            </Form.Control>
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请再次输入密码" },
              {
                validator: (val) => {
                  return formRef.current?.getValues()?.password === val
                    ? true
                    : "密码不一致";
                },
              },
            ]}
          >
            <Form.Label>确认密码</Form.Label>
            <Form.Control>
              <Input placeholder="确认密码" />
            </Form.Control>
          </Form.Item>
        </Cell.Group>
        <View style={{ margin: "16px" }}>
          <Button shape="round" block color="primary" formType="submit">
            提交
          </Button>
          <Button
            style={{ marginTop: "16px" }}
            shape="round"
            block
            color="warning"
            formType="reset"
          >
            重置
          </Button>
        </View>
      </Form>
    </View>
  );
}
