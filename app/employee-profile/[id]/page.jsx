import EmployeeProfilePage from "../../employees/[id]/profile-page";

export default async function EmployeeProfileRoute({ params }) {
    const resolved = await params;
    return <EmployeeProfilePage id={resolved.id} />;
}
