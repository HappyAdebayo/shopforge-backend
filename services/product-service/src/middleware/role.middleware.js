const roleMiddleware = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const isAllowed =
            allowedRoles.includes(req.user.role) ||
            req.user.role === "admin" ||
            (allowedRoles.includes("vendor") && req.user.vendorStatus === "approved");

        if (!isAllowed) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

export default roleMiddleware;