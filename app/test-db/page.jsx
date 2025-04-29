"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function TestDatabasePage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setResult(data)
      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ")
      console.error("Error testing database connection:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ทดสอบการเชื่อมต่อฐานข้อมูล</CardTitle>
            <CardDescription>ใช้หน้านี้เพื่อตรวจสอบว่าแอปพลิเคชันสามารถเชื่อมต่อกับฐานข้อมูล Supabase ได้หรือไม่</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && !error && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-600 dark:text-green-400">เชื่อมต่อสำเร็จ</AlertTitle>
                <AlertDescription>เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จ</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                <h3 className="text-sm font-medium mb-2">ข้อมูลการเชื่อมต่อ:</h3>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังทดสอบการเชื่อมต่อ...
                </>
              ) : (
                "ทดสอบการเชื่อมต่อ"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
