import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/constants";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    hoten: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await register({
        hoten: formData.hoten,
        username: formData.username,
        email: formData.email,
        sdt: formData.phone,
        password: formData.password,
      });
      navigate("/");
    } catch (error) {
      // console.error("Register error:", error);
      // const message = (error as any)?.message || "Đăng ký thất bại";
      // toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-8 md:p-12">
          <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={handleSubmit}
          >
            <FieldGroup>
              <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-bold text-foreground">Tạo tài khoản</h1>
                <p className="text-muted-foreground text-base">
                  Điền thông tin để tạo tài khoản của bạn
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-xl text-sm mb-6">
                  {error}
                </div>
              )}

              {/* Register Fields Container */}
              <div className="bg-muted/30 border-2 border-border rounded-2xl p-6 space-y-5 mb-6">
                <Field>
                  <FieldLabel htmlFor="hoten" className="text-base font-semibold">
                    Họ tên
                  </FieldLabel>
                  <Input
                    id="hoten"
                    name="hoten"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.hoten}
                    onChange={(e) =>
                      setFormData({ ...formData, hoten: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username" className="text-base font-semibold">
                    Tên đăng nhập
                  </FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email" className="text-base font-semibold">
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Chúng tôi sẽ sử dụng email này để liên hệ với bạn
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone" className="text-base font-semibold">
                    Số điện thoại
                  </FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Nhập số điện thoại để nhận thông báo đơn hàng
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password" className="text-base font-semibold">
                    Mật khẩu
                  </FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Tối thiểu 6 ký tự
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password" className="text-base font-semibold">
                    Xác nhận mật khẩu
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Nhập lại mật khẩu để xác nhận
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </Field>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Hoặc đăng ký với
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold border-2 hover:bg-muted"
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/auth/facebook`;
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold border-2 hover:bg-muted"
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/auth/google`;
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              </div>

              <FieldDescription className="text-center text-base">
                Đã có tài khoản?{" "}
                <a href="/login" className="text-primary font-semibold hover:underline">
                  Đăng nhập
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
